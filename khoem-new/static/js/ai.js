/*
 * KHOEM_AI additive client module
 * --------------------------------
 * This file is intentionally independent from the legacy inline script.
 * It does not claim existing IDs, route names, or global function names.
 *
 * Optional usage:
 *   window.KhoemAI.chat("session_id", "សួស្តី")
 *   window.KhoemAI.music({ sessionId, prompt: "..." })
 *
 * When static/js/api-client.js is already loaded, this module reuses
 * window.KhoemAPI so the existing API-key and error behavior is preserved.
 */
(function (window, document) {
  "use strict";

  var existing = window.KhoemAI;
  var api = existing && typeof existing === "object" ? existing : {};
  var apiBase = "";

  function getStoredApiKey() {
    try {
      return window.localStorage.getItem("khoem_api_key") || "";
    } catch (error) {
      return "";
    }
  }

  function buildHeaders(extraHeaders) {
    var headers = Object.assign(
      { "Content-Type": "application/json" },
      extraHeaders || {}
    );
    var key = getStoredApiKey();
    if (key && !headers["X-API-Key"]) {
      headers["X-API-Key"] = key;
    }
    return headers;
  }

  function parseResponse(response) {
    return response.text().then(function (text) {
      var data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (error) {
          data = { error: "Server returned an invalid JSON response." };
        }
      }

      if (!response.ok) {
        var requestError = new Error(
          data.error || "The API request was not successful."
        );
        requestError.status = response.status;
        requestError.payload = data;
        throw requestError;
      }
      return data;
    });
  }

  function request(path, options) {
    var config = options || {};
    var method = config.method || "GET";
    var body = config.body;
    var headers = buildHeaders(config.headers);

    /*
     * Reuse the old client when available. This avoids creating a second
     * API-key implementation beside static/js/api-client.js.
     */
    if (window.KhoemAPI) {
      if (method === "GET" && typeof window.KhoemAPI.get === "function") {
        return window.KhoemAPI.get(path);
      }
      if (method !== "GET" && typeof window.KhoemAPI.post === "function") {
        var parsedBody = body;
        if (typeof body === "string") {
          try {
            parsedBody = JSON.parse(body);
          } catch (error) {
            parsedBody = body;
          }
        }
        return window.KhoemAPI.post(path, parsedBody);
      }
    }

    var fetchOptions = {
      method: method,
      headers: headers,
    };
    if (body !== undefined && body !== null) {
      fetchOptions.body =
        typeof body === "string" ? body : JSON.stringify(body);
    }
    return window.fetch(apiBase + path, fetchOptions).then(parseResponse);
  }

  function requireValue(value, fieldName) {
    if (value === undefined || value === null || String(value).trim() === "") {
      var error = new Error(fieldName + " is required.");
      error.code = "missing_field";
      throw error;
    }
    return value;
  }

  function emit(name, detail) {
    if (typeof window.CustomEvent !== "function") return;
    window.dispatchEvent(new window.CustomEvent(name, { detail: detail }));
  }

  function run(name, callback) {
    return Promise.resolve()
      .then(callback)
      .then(function (result) {
        emit("khoem-ai:success", { operation: name, result: result });
        return result;
      })
      .catch(function (error) {
        emit("khoem-ai:error", { operation: name, error: error });
        throw error;
      });
  }

  api.configure = function (options) {
    var config = options || {};
    apiBase = typeof config.baseUrl === "string" ? config.baseUrl : "";
    return api;
  };

  api.request = request;

  api.chat = function (sessionId, message, options) {
    return run("chat", function () {
      requireValue(sessionId, "session_id");
      requireValue(message, "message");
      var payload = {
        session_id: String(sessionId).trim(),
        message: String(message).trim(),
      };
      if (options && options.systemPrompt) {
        payload.system_prompt = options.systemPrompt;
      }
      return request("/api/chat", {
        method: "POST",
        body: payload,
      });
    });
  };

  api.vision = function (imageBase64, question, mimeType) {
    return run("vision", function () {
      requireValue(imageBase64, "image");
      return request("/api/vision", {
        method: "POST",
        body: {
          image: imageBase64,
          question: question || "សូមពិពណ៌នារូបភាពនេះជាភាសាខ្មែរ",
          mime_type: mimeType || "image/jpeg",
        },
      });
    });
  };

  api.music = function (options) {
    var config = options || {};
    return run("music", function () {
      requireValue(config.sessionId, "session_id");
      requireValue(config.prompt, "prompt");
      return request("/api/music/generate", {
        method: "POST",
        body: {
          session_id: String(config.sessionId).trim(),
          prompt: String(config.prompt).trim(),
          style: config.style || "",
          duration: config.duration === undefined ? 30 : config.duration,
          instrumental: Boolean(config.instrumental),
        },
      });
    });
  };

  api.videoWithMusic = function (options) {
    var config = options || {};
    return run("video-with-music", function () {
      requireValue(config.sessionId, "session_id");
      requireValue(config.videoPrompt, "video_prompt");
      return request("/api/video/generate-with-music", {
        method: "POST",
        body: {
          session_id: String(config.sessionId).trim(),
          video_prompt: String(config.videoPrompt).trim(),
          music_prompt: String(config.musicPrompt || config.videoPrompt).trim(),
          duration: config.duration === undefined ? 10 : config.duration,
          resolution: config.resolution || "720p",
          style: config.style || "cinematic",
          fps: config.fps === undefined ? 24 : config.fps,
          quality: config.quality || "standard",
          instrumental: Boolean(config.instrumental),
        },
      });
    });
  };

  api.directions = function (origin, destination, mode) {
    return run("directions", function () {
      requireValue(origin, "origin");
      requireValue(destination, "destination");
      return request("/api/directions", {
        method: "POST",
        body: {
          origin: origin,
          destination: destination,
          mode: mode || "driving",
        },
      });
    });
  };

  api.places = {
    list: function (sessionId) {
      return run("places:list", function () {
        requireValue(sessionId, "session_id");
        return request(
          "/api/places/" + encodeURIComponent(String(sessionId).trim())
        );
      });
    },
    find: function (sessionId, label) {
      return run("places:find", function () {
        requireValue(sessionId, "session_id");
        requireValue(label, "label");
        return request(
          "/api/places/" +
            encodeURIComponent(String(sessionId).trim()) +
            "/" +
            encodeURIComponent(String(label).trim())
        );
      });
    },
    save: function (sessionId, label, latitude, longitude) {
      return run("places:save", function () {
        requireValue(sessionId, "session_id");
        requireValue(label, "label");
        return request("/api/places", {
          method: "POST",
          body: {
            session_id: String(sessionId).trim(),
            label: String(label).trim(),
            lat: latitude,
            lng: longitude,
          },
        });
      });
    },
    remove: function (sessionId, label) {
      return run("places:remove", function () {
        requireValue(sessionId, "session_id");
        requireValue(label, "label");
        return request(
          "/api/places/" +
            encodeURIComponent(String(sessionId).trim()) +
            "/" +
            encodeURIComponent(String(label).trim()),
          { method: "DELETE" }
        );
      });
    },
  };

  api.toBase64 = function (file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error("A file is required."));
        return;
      }
      var reader = new window.FileReader();
      reader.onload = function () {
        resolve(String(reader.result).split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /*
   * Optional declarative bridge for new markup. Existing index.html has no
   * data-ai-action attributes, so this adds no listeners to the legacy UI.
   *
   * Example:
   * <button data-ai-action="chat" data-ai-session="..." data-ai-message="...">
   */
  api.bind = function (root) {
    var container = root || document;
    var elements = container.querySelectorAll("[data-ai-action]");
    Array.prototype.forEach.call(elements, function (element) {
      if (element.getAttribute("data-ai-bound") === "true") return;
      element.setAttribute("data-ai-bound", "true");
      element.addEventListener("click", function () {
        var action = element.getAttribute("data-ai-action");
        var sessionId = element.getAttribute("data-ai-session");
        var message = element.getAttribute("data-ai-message");
        var operation;

        if (action === "chat") {
          operation = api.chat(sessionId, message);
        } else if (action === "directions") {
          operation = api.directions(
            element.getAttribute("data-ai-origin"),
            element.getAttribute("data-ai-destination"),
            element.getAttribute("data-ai-mode")
          );
        } else {
          return;
        }

        operation.catch(function () {
          /* The global khoem-ai:error event remains available to the host UI. */
        });
      });
    });
    return api;
  };

  window.KhoemAI = api;
  document.addEventListener("DOMContentLoaded", function () {
    api.bind(document);
  });
})(window, document);
