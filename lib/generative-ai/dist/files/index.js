'use strict';

var fs = require('fs');

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Basic error type for this SDK.
 * @public
 */
class GoogleGenerativeAIError extends Error {
    constructor(message) {
        super(`[GoogleGenerativeAI Error]: ${message}`);
    }
}
/**
 * Error class covering HTTP errors when calling the server. Includes HTTP
 * status, statusText, and optional details, if provided in the server response.
 * @public
 */
class GoogleGenerativeAIFetchError extends GoogleGenerativeAIError {
    constructor(message, status, statusText, errorDetails) {
        super(message);
        this.status = status;
        this.statusText = statusText;
        this.errorDetails = errorDetails;
    }
}
/**
 * Errors in the contents of a request originating from user input.
 * @public
 */
class GoogleGenerativeAIRequestInputError extends GoogleGenerativeAIError {
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
const DEFAULT_API_VERSION = "v1beta";
/**
 * We can't `require` package.json if this runs on web. We will use rollup to
 * swap in the version number here at build time.
 */
const PACKAGE_VERSION = "0.12.0";
const PACKAGE_LOG_HEADER = "genai-js";
var Task;
(function (Task) {
    Task["GENERATE_CONTENT"] = "generateContent";
    Task["STREAM_GENERATE_CONTENT"] = "streamGenerateContent";
    Task["COUNT_TOKENS"] = "countTokens";
    Task["EMBED_CONTENT"] = "embedContent";
    Task["BATCH_EMBED_CONTENTS"] = "batchEmbedContents";
})(Task || (Task = {}));
/**
 * Simple, but may become more complex if we add more versions to log.
 */
function getClientHeaders(requestOptions) {
    const clientHeaders = [];
    if (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.apiClient) {
        clientHeaders.push(requestOptions.apiClient);
    }
    clientHeaders.push(`${PACKAGE_LOG_HEADER}/${PACKAGE_VERSION}`);
    return clientHeaders.join(" ");
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var FilesTask;
(function (FilesTask) {
    FilesTask["UPLOAD"] = "upload";
    FilesTask["LIST"] = "list";
    FilesTask["GET"] = "get";
    FilesTask["DELETE"] = "delete";
})(FilesTask || (FilesTask = {}));

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const taskToMethod = {
    [FilesTask.UPLOAD]: "POST",
    [FilesTask.LIST]: "GET",
    [FilesTask.GET]: "GET",
    [FilesTask.DELETE]: "DELETE",
};
class FilesRequestUrl {
    constructor(task, apiKey, requestOptions) {
        var _a, _b;
        this.task = task;
        this.apiKey = apiKey;
        this.requestOptions = requestOptions;
        const apiVersion = ((_a = this.requestOptions) === null || _a === void 0 ? void 0 : _a.apiVersion) || DEFAULT_API_VERSION;
        const baseUrl = ((_b = this.requestOptions) === null || _b === void 0 ? void 0 : _b.baseUrl) || DEFAULT_BASE_URL;
        let initialUrl = baseUrl;
        if (this.task === FilesTask.UPLOAD) {
            initialUrl += `/upload`;
        }
        initialUrl += `/${apiVersion}/files`;
        this._url = new URL(initialUrl);
    }
    appendPath(path) {
        this._url.pathname = this._url.pathname + `/${path}`;
    }
    appendParam(key, value) {
        this._url.searchParams.append(key, value);
    }
    toString() {
        return this._url.toString();
    }
}
function getHeaders(url) {
    const headers = new Headers();
    headers.append("x-goog-api-client", getClientHeaders(url.requestOptions));
    headers.append("x-goog-api-key", url.apiKey);
    return headers;
}
async function makeFilesRequest(url, headers, body, fetchFn = fetch) {
    const requestInit = {
        method: taskToMethod[url.task],
        headers,
    };
    if (body) {
        requestInit.body = body;
    }
    const signal = getSignal(url.requestOptions);
    if (signal) {
        requestInit.signal = signal;
    }
    try {
        const response = await fetchFn(url.toString(), requestInit);
        if (!response.ok) {
            let message = "";
            let errorDetails;
            try {
                const json = await response.json();
                message = json.error.message;
                if (json.error.details) {
                    message += ` ${JSON.stringify(json.error.details)}`;
                    errorDetails = json.error.details;
                }
            }
            catch (e) {
                // ignored
            }
            throw new GoogleGenerativeAIFetchError(`Error fetching from ${url.toString()}: [${response.status} ${response.statusText}] ${message}`, response.status, response.statusText, errorDetails);
        }
        else {
            return response;
        }
    }
    catch (e) {
        let err = e;
        if (!(e instanceof GoogleGenerativeAIFetchError)) {
            err = new GoogleGenerativeAIError(`Error fetching from ${url.toString()}: ${e.message}`);
            err.stack = e.stack;
        }
        throw err;
    }
}
/**
 * Get AbortSignal if timeout is specified
 */
function getSignal(requestOptions) {
    if ((requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeout) >= 0) {
        const abortController = new AbortController();
        const signal = abortController.signal;
        setTimeout(() => abortController.abort(), requestOptions.timeout);
        return signal;
    }
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Class for managing GoogleAI file uploads.
 * @public
 */
class GoogleAIFileManager {
    constructor(apiKey, _requestOptions) {
        this.apiKey = apiKey;
        this._requestOptions = _requestOptions;
    }
    /**
     * Upload a file
     */
    async uploadFile(filePath, fileMetadata) {
        const file = fs.readFileSync(filePath);
        const url = new FilesRequestUrl(FilesTask.UPLOAD, this.apiKey, this._requestOptions);
        const uploadHeaders = getHeaders(url);
        const boundary = generateBoundary();
        uploadHeaders.append("X-Goog-Upload-Protocol", "multipart");
        uploadHeaders.append("Content-Type", `multipart/related; boundary=${boundary}`);
        const uploadMetadata = getUploadMetadata(fileMetadata);
        // Multipart formatting code taken from @firebase/storage
        const metadataString = JSON.stringify({ file: uploadMetadata });
        const preBlobPart = "--" +
            boundary +
            "\r\n" +
            "Content-Type: application/json; charset=utf-8\r\n\r\n" +
            metadataString +
            "\r\n--" +
            boundary +
            "\r\n" +
            "Content-Type: " +
            fileMetadata.mimeType +
            "\r\n\r\n";
        const postBlobPart = "\r\n--" + boundary + "--";
        const blob = new Blob([preBlobPart, file, postBlobPart]);
        const response = await makeFilesRequest(url, uploadHeaders, blob);
        return response.json();
    }
    /**
     * List all uploaded files
     */
    async listFiles(listParams) {
        const url = new FilesRequestUrl(FilesTask.LIST, this.apiKey, this._requestOptions);
        if (listParams === null || listParams === void 0 ? void 0 : listParams.pageSize) {
            url.appendParam("pageSize", listParams.pageSize.toString());
        }
        if (listParams === null || listParams === void 0 ? void 0 : listParams.pageToken) {
            url.appendParam("pageToken", listParams.pageToken);
        }
        const uploadHeaders = getHeaders(url);
        const response = await makeFilesRequest(url, uploadHeaders);
        return response.json();
    }
    /**
     * Get metadata for file with given ID
     */
    async getFile(fileId) {
        const url = new FilesRequestUrl(FilesTask.GET, this.apiKey, this._requestOptions);
        url.appendPath(parseFileId(fileId));
        const uploadHeaders = getHeaders(url);
        const response = await makeFilesRequest(url, uploadHeaders);
        return response.json();
    }
    /**
     * Delete file with given ID
     */
    async deleteFile(fileId) {
        const url = new FilesRequestUrl(FilesTask.DELETE, this.apiKey, this._requestOptions);
        url.appendPath(parseFileId(fileId));
        const uploadHeaders = getHeaders(url);
        await makeFilesRequest(url, uploadHeaders);
    }
}
/**
 * If fileId is prepended with "files/", remove prefix
 */
function parseFileId(fileId) {
    if (fileId.startsWith("files/")) {
        return fileId.split("files/")[1];
    }
    if (!fileId) {
        throw new GoogleGenerativeAIError(`Invalid fileId ${fileId}. ` +
            `Must be in the format "files/filename" or "filename"`);
    }
    return fileId;
}
function generateBoundary() {
    let str = "";
    for (let i = 0; i < 2; i++) {
        str = str + Math.random().toString().slice(2);
    }
    return str;
}
function getUploadMetadata(inputMetadata) {
    if (!inputMetadata.mimeType) {
        throw new GoogleGenerativeAIRequestInputError("Must provide a mimeType.");
    }
    const uploadMetadata = {
        mimeType: inputMetadata.mimeType,
        displayName: inputMetadata.displayName,
    };
    if (inputMetadata.name) {
        uploadMetadata.name = inputMetadata.name.includes("/")
            ? inputMetadata.name
            : `files/${inputMetadata.name}`;
    }
    return uploadMetadata;
}

/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Processing state of the `File`.
 * @public
 */
exports.FileState = void 0;
(function (FileState) {
    // The default value. This value is used if the state is omitted.
    FileState["STATE_UNSPECIFIED"] = "STATE_UNSPECIFIED";
    // File is being processed and cannot be used for inference yet.
    FileState["PROCESSING"] = "PROCESSING";
    // File is processed and available for inference.
    FileState["ACTIVE"] = "ACTIVE";
    // File failed processing.
    FileState["FAILED"] = "FAILED";
})(exports.FileState || (exports.FileState = {}));

exports.GoogleAIFileManager = GoogleAIFileManager;
//# sourceMappingURL=index.js.map
