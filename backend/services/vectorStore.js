/**
 * In-memory vector store using TF-IDF similarity.
 * No external API calls for embeddings — fully self-contained.
 */

// In-memory storage: subjectId -> { ids[], documents[], metadatas[] }
const collections = {};

function getCollection(subjectId) {
    if (!collections[subjectId]) {
        collections[subjectId] = { ids: [], documents: [], metadatas: [] };
    }
    return collections[subjectId];
}

// --- TF-IDF helpers ---

function tokenize(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}

function termFrequency(tokens) {
    const tf = {};
    for (const t of tokens) {
        tf[t] = (tf[t] || 0) + 1;
    }
    // Normalize
    const len = tokens.length || 1;
    for (const t in tf) tf[t] /= len;
    return tf;
}

function cosineSim(tfA, tfB) {
    const allTerms = new Set([...Object.keys(tfA), ...Object.keys(tfB)]);
    let dot = 0, magA = 0, magB = 0;
    for (const t of allTerms) {
        const a = tfA[t] || 0;
        const b = tfB[t] || 0;
        dot += a * b;
        magA += a * a;
        magB += b * b;
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

/**
 * Add chunks to the store for a given subject.
 */
async function addChunks(subjectId, chunks, noteId) {
    const col = getCollection(subjectId);
    for (let i = 0; i < chunks.length; i++) {
        col.ids.push(`${noteId}_chunk_${i}`);
        col.documents.push(chunks[i].content);
        col.metadatas.push({ ...chunks[i].metadata, noteId });
    }
    console.log(`[VectorStore] Added ${chunks.length} chunks for subject ${subjectId}`);
}

/**
 * Query for the most relevant chunks using TF-IDF cosine similarity.
 */
async function queryChunks(subjectId, query, topK = 5) {
    const col = collections[subjectId];
    if (!col || col.documents.length === 0) return [];

    const queryTF = termFrequency(tokenize(query));

    const scored = col.documents.map((doc, i) => ({
        content: doc,
        metadata: col.metadatas[i],
        score: cosineSim(queryTF, termFrequency(tokenize(doc))),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(({ content, metadata }) => ({ content, metadata }));
}

/**
 * Remove all chunks belonging to a specific note.
 */
async function removeNoteChunks(subjectId, noteId) {
    const col = collections[subjectId];
    if (!col) return;

    const keep = [];
    for (let i = 0; i < col.ids.length; i++) {
        if (col.metadatas[i].noteId !== noteId) keep.push(i);
    }

    collections[subjectId] = {
        ids: keep.map((i) => col.ids[i]),
        documents: keep.map((i) => col.documents[i]),
        metadatas: keep.map((i) => col.metadatas[i]),
    };
}

/**
 * Delete the entire collection for a subject.
 */
async function deleteSubjectCollection(subjectId) {
    delete collections[subjectId];
}

module.exports = {
    addChunks,
    queryChunks,
    removeNoteChunks,
    deleteSubjectCollection,
};
