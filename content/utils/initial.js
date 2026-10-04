const waitElementToAppearOnScreen = async (parent, element) => {
  //this function will be called by ID
  const targetNode = parent.querySelector(element);
  const config = {
    childList: true,
    subtree: true,
  };
  return new Promise((resolve, reject) => {
    if (parent.querySelector(element))
      return resolve(parent.querySelector(element));
    const observer = new MutationObserver((mutationsList, observer) => {
      if (parent.querySelector(element)) {
        observer.disconnect();
        resolve(parent.querySelector(element));
      }
    });
    observer.observe(parent, config);
  });
};

const getElementFromScreen = async (parent, element) => {
//   myLog("Waiting for the element with the selector: ", element);
  //wait for atleast one element to be on the screen
  const target = await waitElementToAppearOnScreen(parent, element);
//   myLog("Element is on the screen as the ouput is ", target);
  return target;
};