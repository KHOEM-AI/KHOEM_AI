/*
 * Secure Vault Matrix frontend.
 * Required page markup is documented in the integration notes supplied with
 * this module. The script exits safely when the vault card is not present.
 */
(function (window, document) {
  "use strict";

  var CATEGORY_ICONS = {
    document: "📄",
    image: "🖼️",
    video: "🎥",
    code: "💻",
    audio: "🎵",
  };
  var CATEGORY_LABELS = {
    document: "ឯកសារ",
    image: "រូបភាព",
    video: "វីដេអូ",
    code: "កូដ",
    audio: "សំឡេង",
  };
  var MAX_FILE_BYTES = 25 * 1024 * 1024;
  var unlockToken = null;
  var activeCategory = "document";
  var faceModelsLoaded = false;
  var faceStream = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function fmtSize(bytes) {
    var size = Number(bytes) || 0;
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  }

  function api(path, options) {
    var config = options || {};
    var headers = Object.assign({}, config.headers || {});
    if (unlockToken) headers["X-Vault-Token"] = unlockToken;
    return window
      .fetch("/api/vault" + path, {
        method: config.method || "GET",
        headers: headers,
        body: config.body,
        credentials: "same-origin",
      })
      .then(function (response) {
        return response.text().then(function (text) {
          var body = {};
          if (text) {
            try {
              body = JSON.parse(text);
            } catch (error) {
              body = { error: "Server returned an invalid response." };
            }
          }
          if (!response.ok) {
            var requestError = new Error(
              body.error || "Vault request failed (HTTP " + response.status + ")"
            );
            requestError.status = response.status;
            requestError.body = body;
            throw requestError;
          }
          return body;
        });
      });
  }

  function showError(message) {
    var element = byId("vault-error");
    if (!element) return;
    element.textContent = message || "Vault request failed";
    element.classList.add("is-visible");
  }

  function clearError() {
    var element = byId("vault-error");
    if (element) element.classList.remove("is-visible");
  }

  function refreshStatus() {
    return api("/status")
      .then(function (status) {
        var state = byId("vault-state");
        if (!state) return status;

        if (!status.vault_exists) {
          state.textContent = "មិនទាន់រៀបចំ — សូមកំណត់ Password";
          state.className = "vault-state";
          renderSetupGate();
        } else if (!unlockToken) {
          state.textContent = "🔒 បិទសោ";
          state.className = "vault-state";
          renderUnlockGate(status);
        } else {
          state.textContent = "🔓 បើកសោហើយ";
          state.className = "vault-state unlocked";
          renderUnlocked(status);
        }
        return status;
      })
      .catch(function (error) {
        showError(error.message);
        throw error;
      });
  }

  function renderSetupGate() {
    var gate = byId("vault-gate");
    var unlocked = byId("vault-unlocked");
    if (!gate || !unlocked) return;
    gate.hidden = false;
    unlocked.hidden = true;
    byId("vault-gate-title").textContent = "កំណត់ Password សម្រាប់ Vault";
    byId("vault-gate-password").value = "";
    byId("vault-face-unlock-btn").hidden = true;
    byId("vault-gate-submit").textContent = "បង្កើត Vault";
    byId("vault-gate-submit").onclick = handleSetup;
  }

  function renderUnlockGate(status) {
    var gate = byId("vault-gate");
    var unlocked = byId("vault-unlocked");
    if (!gate || !unlocked) return;
    gate.hidden = false;
    unlocked.hidden = true;
    byId("vault-gate-title").textContent = "បញ្ចូល Password ដើម្បីបើក Vault";
    byId("vault-gate-password").value = "";
    byId("vault-face-unlock-btn").hidden = !status.face_enrolled;
    byId("vault-gate-submit").textContent = "បើកសោ";
    byId("vault-gate-submit").onclick = handleUnlock;
  }

  function renderUnlocked(status) {
    byId("vault-gate").hidden = true;
    byId("vault-unlocked").hidden = false;
    renderGoogleRow(status);
    loadFiles();
  }

  function renderGoogleRow(status) {
    var row = byId("vault-google-row");
    if (!row) return;
    if (status.google_linked) {
      row.innerHTML =
        '<span class="linked">ភ្ជាប់ជាមួយ ' +
        escapeHtml(status.google_email || "Google") +
        "</span>";
      return;
    }
    row.innerHTML =
      "<span>Google link មិនទាន់បានបើកសម្រាប់ app នេះ</span>";
  }

  function handleSetup() {
    clearError();
    var password = byId("vault-gate-password").value;
    if (password.length < 8) {
      showError("Password ត្រូវមានយ៉ាងតិច ៨ តួអក្សរ");
      return;
    }
    api("/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password }),
    })
      .then(function (result) {
        unlockToken = result.unlock_token;
        return refreshStatus();
      })
      .catch(function (error) {
        showError(error.message);
      });
  }

  function handleUnlock() {
    clearError();
    var password = byId("vault-gate-password").value;
    if (!password) {
      showError("សូមបញ្ចូល Password");
      return;
    }
    api("/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password }),
    })
      .then(function (result) {
        unlockToken = result.unlock_token;
        return refreshStatus();
      })
      .catch(function (error) {
        showError(error.message);
      });
  }

  function ensureFaceModels() {
    if (faceModelsLoaded) return Promise.resolve(true);
    if (typeof window.faceapi === "undefined") {
      showError("face-api.js មិនទាន់ load — Password unlock នៅតែអាចប្រើបាន");
      return Promise.resolve(false);
    }
    return Promise.all([
      window.faceapi.nets.tinyFaceDetector.loadFromUri("/static/models"),
      window.faceapi.nets.faceLandmark68Net.loadFromUri("/static/models"),
      window.faceapi.nets.faceRecognitionNet.loadFromUri("/static/models"),
    ])
      .then(function () {
        faceModelsLoaded = true;
        return true;
      })
      .catch(function () {
        showError("មិនអាច load Face model បានទេ — ពិនិត្យ /static/models");
        return false;
      });
  }

  function openFaceCapture(onDescriptor) {
    clearError();
    var box = byId("vault-face-box");
    var video = byId("vault-face-video");
    return ensureFaceModels().then(function (ready) {
      if (!ready) return;
      box.hidden = false;
      return window.navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" } })
        .then(function (stream) {
          faceStream = stream;
          video.srcObject = stream;
          return video.play();
        })
        .then(function () {
          byId("vault-face-capture-btn").hidden = false;
          byId("vault-face-capture-btn").onclick = function () {
            return window.faceapi
              .detectSingleFace(
                video,
                new window.faceapi.TinyFaceDetectorOptions()
              )
              .withFaceLandmarks()
              .withFaceDescriptor()
              .then(function (detection) {
                if (!detection) {
                  showError("រកមិនឃើញមុខ — សូមសាកម្តងទៀត");
                  return;
                }
                closeFaceCapture();
                onDescriptor(Array.from(detection.descriptor));
              })
              .catch(function () {
                showError("Face detection បរាជ័យ");
              });
          };
        })
        .catch(function () {
          showError("មិនអាចបើកកាមេរ៉ាបានទេ — សូមអនុញ្ញាត camera permission");
          box.hidden = true;
        });
    });
  }

  function closeFaceCapture() {
    byId("vault-face-box").hidden = true;
    byId("vault-face-capture-btn").hidden = true;
    if (faceStream) {
      faceStream.getTracks().forEach(function (track) {
        track.stop();
      });
      faceStream = null;
    }
  }

  function initFaceButtons() {
    var enroll = byId("vault-enroll-face-btn");
    var verify = byId("vault-face-unlock-btn");
    if (enroll) {
      enroll.onclick = function () {
        openFaceCapture(function (descriptor) {
          api("/face/enroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ descriptor: descriptor }),
          })
            .then(refreshStatus)
            .catch(function (error) {
              showError(error.message);
            });
        });
      };
    }
    if (verify) {
      verify.onclick = function () {
        openFaceCapture(function (descriptor) {
          api("/face/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ descriptor: descriptor }),
          })
            .then(function (result) {
              unlockToken = result.unlock_token;
              return refreshStatus();
            })
            .catch(function (error) {
              showError(error.message);
            });
        });
      };
    }
  }

  function initTabs() {
    document.querySelectorAll(".vault-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".vault-tab").forEach(function (item) {
          item.classList.remove("is-active");
        });
        tab.classList.add("is-active");
        activeCategory = tab.dataset.category || "document";
        loadFiles();
      });
    });
  }

  function uploadFile(file) {
    clearError();
    if (file.size > MAX_FILE_BYTES) {
      showError("ឯកសារធំពេក (អតិបរមា ២៥ MB)");
      return;
    }

    var form = new window.FormData();
    form.append("file", file);
    form.append("category", activeCategory);
    var progress = byId("vault-upload-progress");
    var fill = progress.querySelector("span");
    progress.classList.add("is-visible");
    fill.style.width = "0%";

    var xhr = new window.XMLHttpRequest();
    xhr.open("POST", "/api/vault/files");
    xhr.withCredentials = true;
    if (unlockToken) xhr.setRequestHeader("X-Vault-Token", unlockToken);
    xhr.upload.onprogress = function (event) {
      if (event.lengthComputable) {
        fill.style.width = Math.round((event.loaded / event.total) * 100) + "%";
      }
    };
    xhr.onload = function () {
      progress.classList.remove("is-visible");
      if (xhr.status >= 200 && xhr.status < 300) {
        loadFiles();
        return;
      }
      try {
        showError(JSON.parse(xhr.responseText).error || "Upload បរាជ័យ");
      } catch (error) {
        showError("Upload បរាជ័យ");
      }
    };
    xhr.onerror = function () {
      progress.classList.remove("is-visible");
      showError("Upload បរាជ័យ — បញ្ហាបណ្តាញ");
    };
    xhr.send(form);
  }

  function initDropzone() {
    var zone = byId("vault-dropzone");
    var input = byId("vault-file-input");
    if (!zone || !input) return;
    zone.addEventListener("click", function () {
      input.click();
    });
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) uploadFile(input.files[0]);
    });
    ["dragenter", "dragover"].forEach(function (eventName) {
      zone.addEventListener(eventName, function (event) {
        event.preventDefault();
        zone.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach(function (eventName) {
      zone.addEventListener(eventName, function (event) {
        event.preventDefault();
        zone.classList.remove("is-dragover");
      });
    });
    zone.addEventListener("drop", function (event) {
      var file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) uploadFile(file);
    });
  }

  function loadFiles() {
    var list = byId("vault-file-list");
    if (!list) return Promise.resolve();
    return api("/files?category=" + encodeURIComponent(activeCategory))
      .then(function (result) {
        renderFiles(result.files || []);
      })
      .catch(function (error) {
        if (error.status === 401) {
          unlockToken = null;
          refreshStatus();
          return;
        }
        list.innerHTML =
          '<div class="vault-empty">មិនអាចទាញយកបញ្ជីឯកសារបានទេ</div>';
      });
  }

  function renderFiles(files) {
    var list = byId("vault-file-list");
    if (!files.length) {
      list.innerHTML =
        '<div class="vault-empty">មិនទាន់មានឯកសារ ' +
        CATEGORY_LABELS[activeCategory] +
        " នៅឡើយទេ</div>";
      return;
    }
    list.innerHTML = "";
    files.forEach(function (file) {
      var row = document.createElement("div");
      row.className = "vault-file-row";

      var icon = document.createElement("span");
      icon.className = "vault-file-icon";
      icon.textContent = CATEGORY_ICONS[file.category] || "📄";

      var meta = document.createElement("div");
      meta.className = "vault-file-meta";
      var name = document.createElement("div");
      name.className = "vault-file-name";
      name.textContent = file.original_name;
      var sub = document.createElement("div");
      sub.className = "vault-file-sub";
      sub.textContent =
        fmtSize(file.size_bytes) +
        " · " +
        new Date(file.uploaded_at).toLocaleString();
      meta.append(name, sub);

      var actions = document.createElement("div");
      actions.className = "vault-file-actions";
      var download = makeFileButton("Download", "⭳", false);
      var remove = makeFileButton("Delete", "✕", true);
      download.addEventListener("click", function () {
        downloadFile(file.id, file.original_name);
      });
      remove.addEventListener("click", function () {
        deleteFile(file.id);
      });
      actions.append(download, remove);
      row.append(icon, meta, actions);
      list.appendChild(row);
    });
  }

  function makeFileButton(title, text, danger) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "vault-icon-btn" + (danger ? " danger" : "");
    button.title = title;
    button.textContent = text;
    return button;
  }

  function downloadFile(id, originalName) {
    return window
      .fetch("/api/vault/files/" + encodeURIComponent(id) + "/download", {
        headers: unlockToken ? { "X-Vault-Token": unlockToken } : {},
        credentials: "same-origin",
      })
      .then(function (response) {
        if (!response.ok) {
          return response
            .json()
            .then(function (body) {
              throw new Error(body.error || "Download បរាជ័យ");
            })
            .catch(function (error) {
              throw error instanceof Error
                ? error
                : new Error("Download បរាជ័យ");
            });
        }
        return response.blob();
      })
      .then(function (blob) {
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = originalName || "file";
        link.click();
        window.setTimeout(function () {
          window.URL.revokeObjectURL(url);
        }, 500);
      })
      .catch(function (error) {
        showError(error.message || "Download បរាជ័យ");
      });
  }

  function deleteFile(id) {
    if (!window.confirm("លុបឯកសារនេះ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។")) return;
    api("/files/" + encodeURIComponent(id), { method: "DELETE" })
      .then(loadFiles)
      .catch(function (error) {
        showError(error.message);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!byId("vault-card")) return;
    initTabs();
    initDropzone();
    initFaceButtons();
    refreshStatus().catch(function () {});

    if (window.location.search.indexOf("vault_google_linked") !== -1) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  });
})(window, document);
