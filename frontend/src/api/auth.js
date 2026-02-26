async function parseJSON(res) {
    const text = await res.text();
    if (!text) {
        throw new Error('Server returned an empty response. Is the backend running?');
    }
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`Unexpected server response: ${text.slice(0, 100)}`);
    }
}

export async function signup({ username, email, password }) {
    const res = await fetch('/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
    });

    const data = await parseJSON(res);

    if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
    }

    return data;
}

export async function login({ email, password }) {
    const res = await fetch('/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });

    const data = await parseJSON(res);

    if (!res.ok) {
        throw new Error(data.message || 'Login failed');
    }

    return data;
}

