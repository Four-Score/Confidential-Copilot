// sync.js
chrome.storage.local.get(['email_queue'], (result) => {
  window.parent.postMessage({
    type: 'EMAIL_QUEUE_SYNC',
    data: result.email_queue || [],
  }, '*');
  console.log('✅ Sent email queue to dashboard');
});

window.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_EMAIL_QUEUE') {
    chrome.storage.local.set({ email_queue: [] }, () => {
      console.log('✅ Cleared extension email queue after sync');
    });
  }
});
