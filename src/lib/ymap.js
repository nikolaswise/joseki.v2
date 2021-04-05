export default function readableMap(map) {
  let value = new Map(Object.entries(map.toJSON()))
  let subs = [];

  const setValue = (newValue) => {
    if (value === newValue) {
      return;{}
    }
    // update stored value so new subscribers can get the initial value
    value = newValue;
    // call all handlers to notify of new value
    subs.forEach((sub) => sub(value));
  };

  const observer = (event, _transaction) => {
    const target = event.target;
    setValue(new Map(Object.entries(target.toJSON())));
  };

  const subscribe = (handler) => {
    subs = [...subs, handler];
    if (subs.length === 1) {
      // update current value to latest that yjs has since we haven't been observing
      value = new Map(Object.entries(map.toJSON()));
      // set an observer to call all handlers whenever there is a change
      map.observe(observer);
    }

    // call just this handler once when it first subscribes
    handler(value);
    // return unsubscribe function
    return () => {
      subs = subs.filter((sub) => sub !== handler);
      if (subs.length === 0) {
        map.unobserve(observer);
      }
    };
  };

  return { subscribe, map };
}