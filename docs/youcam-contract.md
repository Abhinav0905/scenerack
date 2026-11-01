# YouCam Clothes VTO v4 adapter contract

Checked against official documentation on October 31, 2026. This contract was first derived from the official documentation. The adapter then completed 12 live requests; see `docs/live-api-evidence.json`. Pricing and the Bearer-authenticated balance endpoint were verified against the account. The JSON fixtures in `tests/fixtures/youcam-contract.json` remain synthetic.

## Authentication and base URL

Base: `https://yce-api-01.makeupar.com`. Use `Authorization: Bearer YOUR_API_KEY`, with a space after `Bearer`. Send JSON request bodies with `Content-Type: application/json`. Keep the key on the server. Do not send the API authorization header to a presigned upload or result URL.

Sources: [V4 reference](https://docs.perfectcorp.com/reference/ai_clothes/v4.0), [authentication troubleshooting](https://docs.perfectcorp.com/develop/debugging_guide).

## Register and upload image bytes

1. `POST /s2s/v2.0/file` with `{"files":[{"content_type":"image/jpeg","file_name":"actor.jpg","file_size":12345}]}`. `file_size` is the actual byte count. JPG/PNG inputs must be below 10 MB for Clothes VTO.
2. Read `data.files[0].file_id` and `data.files[0].requests[]`. Each upload instruction contains `method`, `url` and `headers`. Upload the raw bytes using the returned instruction, typically PUT. Preserve the returned content type and length.
3. Only use the file ID after the upload succeeds. Registration alone does not upload anything.

The downloadable file OpenAPI has a broken `data: null` plus top-level reference. Both the prose guide and the official Python client use **`data.files[]`**, so use that shape. Avoid code generation from the broken reference.

Sources: [file schema](https://docs.perfectcorp.com/_bundle/reference/file.json?download=), [Clothes upload guide](https://docs.perfectcorp.com/reference/ai_clothes/section/overview/integration-guide), [official client, upload_file](https://github.com/YouCam-API/skills/blob/master/skills/clothes-tryon-studio/scripts/youcam_api.py#L275).

## Create and poll

`POST /s2s/v2.0/task/cloth-v4` accepts one source and one reference, each supplied as a file ID or public URL. Do not include both forms for the same input.

```json
{
  "src_file_id": "fixture-actor-file",
  "ref_file_id": "fixture-jacket-file",
  "garment_category": "outer",
  "filter_multi_person": "strict",
  "change_shoes": false
}
```

Categories: `full_body`, `lower_body`, `upper_body`, `shoes`, `auto`, `outer`. `change_shoes` only affects full/lower-body requests. `filter_multi_person` defaults to `off`; `strict` rejects any additional person. A successful create response has `status: 200` and **`data.task_id`**. Persist this ID before polling.

Poll `GET /s2s/v2.0/task/cloth-v4/{encoded_task_id}`. Documented states at **`data.task_status`** are `running`, `success`, `error`. The example success payload is:

```json
{"status":200,"data":{"task_status":"success","error":null,"results":{"url":"https://example.invalid/result.jpg"}}}
```

The documented result path is **`data.results.url`**, a single string. No result-array path is documented for Clothes v4. Other YouCam features use other schemas; do not copy their array handling as the v4 contract. Missing URL on `success` is a malformed result, not a usable preview.

The bundle has another malformed `results: null` reference. The Clothes prose example supports the nested URL shape above. Poll around every 10 seconds. This is an interval, not a latency promise. The V4 create schema provides no idempotency field: do not blindly repeat a POST after an ambiguous network timeout.

Sources: [V4 reference](https://docs.perfectcorp.com/reference/ai_clothes/v4.0), [Clothes guide](https://docs.perfectcorp.com/reference/ai_clothes), [Clothes OpenAPI](https://docs.perfectcorp.com/_bundle/reference/ai_clothes.json?download=).

## Costs and balance

- `GET /s2s/v2.0/credit/feature-cost?page_size=20` returns **`result.skus[]`** and **`result.next_token`**. Omit `starting_token` on the first request, then pass the returned token until empty/null. SKU fields are `description`, `amount`, `unit`, `proc_unit`, `run_task_url`. Match the task URL pathname `/s2s/v2.0/task/cloth-v4`, not a guessed description. Cost is `amount` for `proc_unit` units of the given `unit`.
- Official V4 release pricing is **2 units per image**, including `outer`. Treat this as a documented estimate until current feature-cost data confirms it.
- Balance is `GET /s2s/v1.0/client/credit`. Response: **`results[]`**, with `type`, `amount_dec`, deprecated `amount`, and `expiry` in Unix milliseconds. Prefer `amount_dec ?? amount`, preserving decimals. Sum unexpired `ApiSubsToken` and `ApiPaygToken` batches. Do not interpret a failed request as zero balance.
- The balance OpenAPI still names legacy access-token authentication. The official YouCam Python client sends the API key directly as Bearer to this same endpoint. That is the best current implementation evidence, but a live read-only check must settle compatibility. If balance fails while V2 succeeds, report balance unavailable rather than declaring the key invalid.

Sources: [unit schema](https://docs.perfectcorp.com/_bundle/reference/unit_system.json?download=), [official client, get_credits/headers](https://github.com/YouCam-API/skills/blob/master/skills/clothes-tryon-studio/scripts/youcam_api.py#L135), [official V4 price](https://www.perfectcorp.com/business/blog/ai-clothes/ai-clothes-try-on-api-v4-outerwear).

## Errors and limits

Separate HTTP failure from an HTTP-200 task with `data.task_status: "error"`. Create failures include `InvalidParameters`, `CreditInsufficiency`, `BadRequest`, `InvalidStyleGroup`, `InvalidStyle`. Authentication uses HTTP 401, rate limiting 429. A poll may return HTTP 400 for an invalid task and HTTP 500 for timeout.

Engine codes include `error_pose`, `error_no_face`, `error_download_image`, `error_decode_image`, `exceed_max_filesize`, `error_nsfw_content_detected`, `error_inference`, `unknown_internal_error`. The Clothes guide also lists `error_multi_person`, `error_invalid_src`, `error_invalid_ref`, `error_apply_region_mismatch`, `error_editing_failed`; the general page uses `error_multiple_people`. Preserve unknown codes instead of requiring an exhaustive enum. Read `data.error` and optional `data.error_message`.

The current limit is 250 requests per 300 seconds per IP and per token. Its separate suggestion of 5 QPS is inconsistent with sustained quota arithmetic; honor the 250/300-second limit. Use bounded polling concurrency and backoff on 429. Keep the existing task ID when pausing polling.

Sources: [Clothes OpenAPI](https://docs.perfectcorp.com/_bundle/reference/ai_clothes.json?download=), [Clothes errors](https://docs.perfectcorp.com/reference/ai_clothes), [general errors](https://docs.perfectcorp.com/develop/error_codes), [rate limit](https://docs.perfectcorp.com/develop/rate_limit).

## Expiry, retention and deletion

The current dedicated retention guide says uploaded files/file IDs, task IDs and generated media are retained for **30 days**. Download URLs last **2 hours**; query the task again for a fresh URL. The Clothes bundle still describes a **24-hour task query window**, so the sources conflict. Fetch and retain consented demo results promptly; do not depend on long task retention or store a signed URL as a permanent asset.

`POST /s2s/v2.0/task/delete` with `{"task_id":"fixture-task-001"}` deletes a finished task and its associated input/output files. Success is `{"status":200}`. Unfinished tasks return `OperationInvalid`. Other codes: `OperationNotSupport`, `InvalidTaskId`, `InvalidParameters`. Treat deletion as affecting shared input files too: do not delete a task while other tasks still need its uploaded source or reference.

Sources: [current retention guide](https://docs.perfectcorp.com/develop/file_retention_period), [Clothes schema](https://docs.perfectcorp.com/_bundle/reference/ai_clothes.json?download=), [delete schema](https://docs.perfectcorp.com/_bundle/reference/task_management.json?download=).
