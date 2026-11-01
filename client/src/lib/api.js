async function send(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    return { ok: false, error: 'We could not reach the server. Please call +91 99000 73744.' };
  }
  try {
    return await res.json();
  } catch {
    return { ok: false, error: 'Unexpected reply from the server. Please call us.' };
  }
}

export const postEnquiry = (body) =>
  send('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const postCareer = (formData) => send('/api/careers', { method: 'POST', body: formData });
