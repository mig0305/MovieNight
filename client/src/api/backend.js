export async function apiRequest(path, options = {}) {
  const { token, body, headers, ...requestOptions } = options;

  let response;

  try {
    response = await fetch(`/api${path}`, {
      ...requestOptions,

      headers: {
        ...(body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),

        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),

        ...headers,
      },

      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }

    throw new Error(
      'Cannot reach the API. Check that the frontend and backend are running.'
    );
  }

  // Some successful operations return no response body.
  if (response.status === 204 && response.ok) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `API request failed (${response.status}). Check the server terminal.`;

    const error = new Error(message);
    error.status = response.status;

    throw error;
  }

  if (data === null) {
    throw new Error('The API returned an empty or invalid JSON response.');
  }

  return data;
}