import '@testing-library/jest-dom';

// Mock URL.createObjectURL for jsdom
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = () => 'blob:mock-url';
}

if (typeof window.confirm === 'undefined') {
  window.confirm = () => true;
}
