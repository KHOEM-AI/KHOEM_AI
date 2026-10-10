import sentencepiece as spm, os
home = os.path.expanduser("~/KHOEM_AI")
spm.SentencePieceTrainer.train(
    input=home + "/KHOEM_AI/corpus-sample/raw/kmwiki-clean.txt",
    model_prefix=home + "/khoem_bpe8k",
    vocab_size=8000,
    model_type="bpe",
    character_coverage=0.9995,
    input_sentence_size=500000,
    shuffle_input_sentence=True,
    max_sentence_length=16384,
    num_threads=4,
)
