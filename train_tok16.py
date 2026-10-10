import sentencepiece as spm, os
home = os.path.expanduser("~/KHOEM_AI")
raw = home + "/KHOEM_AI/corpus-sample/raw/"
spm.SentencePieceTrainer.train(
    input=raw + "kmwiki-clean.txt," + raw + "voa-sample.txt",
    model_prefix=home + "/khoem_bpe16k",
    vocab_size=16000,
    model_type="bpe",
    character_coverage=0.9995,
    input_sentence_size=300000,
    shuffle_input_sentence=True,
    max_sentence_length=4192,
    num_threads=2,
)
