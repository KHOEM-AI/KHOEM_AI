from pathlib import Path
import inspect

def run_training(train_path, valid_path, cfg, log):
    from unsloth import FastLanguageModel
    import torch
    from datasets import load_dataset
    from trl import SFTTrainer, SFTConfig
    model, tokenizer = FastLanguageModel.from_pretrained(model_name=cfg['model_name'], max_seq_length=cfg['max_seq_length'], load_in_4bit=cfg['load_in_4bit'])
    model = FastLanguageModel.get_peft_model(model, r=cfg['lora_rank'], lora_alpha=cfg['lora_alpha'], lora_dropout=cfg['lora_dropout'], target_modules=cfg['target_modules'], use_gradient_checkpointing=cfg['gradient_checkpointing'], random_state=cfg['random_state'])
    def fmt(ex): return {'text': tokenizer.apply_chat_template(ex['messages'], tokenize=False)}
    train=load_dataset('json', data_files=str(train_path), split='train').map(fmt)
    valid=load_dataset('json', data_files=str(valid_path), split='train').map(fmt)
    log(f'Dataset: {len(train):,} train / {len(valid):,} valid')
    sig=inspect.signature(SFTConfig.__init__).parameters
    params=dict(output_dir=cfg['output_dir'], per_device_train_batch_size=cfg['batch_size'], gradient_accumulation_steps=cfg['gradient_accumulation_steps'], num_train_epochs=cfg['epochs'], learning_rate=cfg['learning_rate'], warmup_steps=cfg['warmup_steps'], logging_steps=cfg['logging_steps'], report_to='none', dataset_text_field='text', eval_strategy='epoch', optim=cfg['optimizer'], seed=cfg['random_state'], fp16=not torch.cuda.is_bf16_supported(), bf16=torch.cuda.is_bf16_supported())
    if cfg.get('max_steps'): params['max_steps']=cfg['max_steps']
    if 'max_length' in sig: params['max_length']=cfg['max_seq_length']
    elif 'max_seq_length' in sig: params['max_seq_length']=cfg['max_seq_length']
    if 'evaluation_strategy' in sig and 'eval_strategy' not in sig: params['evaluation_strategy']=params.pop('eval_strategy')
    kwargs={'model':model,'train_dataset':train,'eval_dataset':valid,'args':SFTConfig(**params)}
    tsig=inspect.signature(SFTTrainer.__init__).parameters
    if 'processing_class' in tsig: kwargs['processing_class']=tokenizer
    elif 'tokenizer' in tsig: kwargs['tokenizer']=tokenizer
    trainer=SFTTrainer(**kwargs); log('Starting trainer.train() ...'); trainer.train()
    out=Path(cfg['output_dir'])/'adapter'; out.mkdir(parents=True, exist_ok=True); model.save_pretrained(out); tokenizer.save_pretrained(out); log(f'Saved adapter: {out}')
    log('ចំណាំ: ផ្លូវនេះគ្មាន HumanEval gate ។ ប្រើ notebooks/khoem_lora.ipynb ឬ run_colab.py សម្រាប់ការរក្សាទុកដែលមានការពារ')
