import { useState } from 'react';
import { apiRequest } from '../api/backend';

export default function ConnectionTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleTestConnection() {
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const data = await apiRequest('/health');

      if (data.status !== 'ok') {
        throw new Error('The API returned an unexpected health response.');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Backend connection test</h1>

      <p>
        Click the button to send a request from React to Express.
      </p>

      <button
        type="button"
        onClick={handleTestConnection}
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test connection'}
      </button>

      {result && (
        <div role="status">
          <p>Connected successfully to Express.</p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {error && (
        <p role="alert">{error}</p>
      )}
    </section>
  );
}