const myLog = (...args) => {
  console.log(new Date().toISOString(), ": ", ...args);
};