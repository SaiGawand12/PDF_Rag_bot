import os
os.environ["HF_HUB_OFFLINE"] = "1"

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_name = "google/flan-t5-base"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

def build_context(retrieved_docs, max_tokens=450):

    context = ""

    for doc in retrieved_docs:
        piece = f"[Page {doc['page']}]\n{doc['content']}\n\n"
        temp = context + piece

        tokens = tokenizer(temp, return_tensors="pt")["input_ids"].shape[1]

        if tokens > max_tokens:
            break

        context = temp

    return context


def generate_answer(query, retrieved_docs):

    if not retrieved_docs:
        return "No relevant context found."

    context = build_context(retrieved_docs)

    prompt = f"""
You are an academic PDF assistant.

STRICT RULES:
1. Answer ONLY from context
2. If unsure → say "Not found in document"
3. Use bullet points
4. Each bullet MUST contain page number
5. Do NOT change technical terms

Context:
{context}

Question: {query}

Answer:
"""

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)

    outputs = model.generate(
        **inputs,
        max_new_tokens=200,
        temperature=0.0,
        do_sample=False,
        repetition_penalty=1.2
    )

    return tokenizer.decode(outputs[0], skip_special_tokens=True)


def summarize_topic(topic, retrieved_docs):

    context = build_context(retrieved_docs)

    prompt = f"""
Summarize ONLY using context.
Mention page numbers.

Topic: {topic}

Context:
{context}

Summary:
"""

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)

    outputs = model.generate(**inputs, max_new_tokens=200)

    return tokenizer.decode(outputs[0], skip_special_tokens=True)