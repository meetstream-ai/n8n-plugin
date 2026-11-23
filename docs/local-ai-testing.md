# Local AI testing without OpenAI credit

The MeetStream node does not depend on OpenAI. The AI templates do. To test with a local model, adapt a separate copy of a template; published JSON files still use OpenAI. Alternative-provider tests do not verify the original OpenAI node or its output quality.

## Start a private Ollama server

Install Ollama from its official distribution for your operating system, then download a model:

```sh
ollama pull qwen3:4b
```

If Ollama is not already running, start it on loopback only:

```sh
OLLAMA_HOST=127.0.0.1:11434 OLLAMA_NO_CLOUD=1 OLLAMA_NUM_PARALLEL=1 OLLAMA_MAX_QUEUE=2 ollama serve
```

In another terminal, check `ollama list` and `curl http://127.0.0.1:11434/api/version`. Local inference needs no OpenAI key, but uses disk space and memory. Do not expose Ollama's unauthenticated server on `0.0.0.0` or through a public tunnel.

## Adapt a workflow copy

1. Duplicate the template and keep the copy unpublished while testing.
2. Replace its OpenAI step with an HTTP Request to Ollama's `/api/chat` endpoint. Set `stream: false`, a finite output limit and request timeout, and the model name you installed.
3. Request structured JSON for extraction tasks. Validate it before passing it to a destination. A structured section schema can also make recaps more reliable than open-ended text generation.
4. Convert the response into the original downstream contract: `output[].type = "message"` with `content[].type = "output_text"` and a text string. Render recap sections into readable headings; serialize extraction results as JSON text.
5. Reject empty, malformed, or truncated responses, including `done_reason: "length"`. Run one inference workflow at a time.
6. Stop before destination writes until the output has been reviewed. Use your own inbox for clearly labelled email tests.

For short streaming turns, the October 27 Qwen3 test needed an explicit JSON schema (a single `summary` string), `think: false`, and a bounded output budget. An unconstrained response spent its budget on commentary instead of completing the summary. A complete JSON response still is not a factuality guarantee: an acoustic final turn can be only a date or sentence fragment. Do not infer the missing action or surrounding context. Review such outputs, preserve the original speech as evidence, and treat tests replaying captured turns separately from a fresh live-stream test.

The live template now ends at **Validate live summary**. Keep that step when adapting its provider: convert the local model's response into the Responses contract before it. Short turns stay verbatim, and a summary that drops an original English group reference (`we`, `our`, `us`) falls back to the original speech. This addresses the observed fragment/context and group-to-individual attribution mistakes; it is a conservative fallback, not a general factuality check. Keep `source_text` alongside summaries for review.

The endpoint must be reachable from the n8n runtime. Loopback works when n8n and Ollama run directly on the same computer; inside a container it refers to the container itself. n8n Cloud cannot reach your laptop's loopback address. Do not expose the editor or model server publicly to bypass that limitation.

Private adapters, saved credentials, execution exports, transcripts, recordings, and test destinations are not distributed with this repository. See [testing](testing.md) for portable synthetic checks.

## What a pass means

Cover unknown owners/dates, no action items, internal meetings without customer feedback, and instruction-like text inside speech. Verify actual outputs and executed nodes: a green execution that stopped at an empty filter does not test later nodes.

Schema constraints, prompt rules, and quote matching reduce mistakes; they do not guarantee semantic accuracy or provide a security boundary. Review output before unattended writes. Destination tests still require service credentials and disposable records. Real MeetStream callbacks require secured public HTTPS ingress; Ollama must remain private.
