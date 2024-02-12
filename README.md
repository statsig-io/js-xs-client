# Usage

Clone the repo

```shell
git clone https://github.com/statsig-io/js-xs-client.git
```

Build the Statsig.min.js file

```shell
cd js-xs-client
npm i
npm run build
```

# Testing

Once built, open the index.html file.

# Example

```js
// NOTE: Replace with your own key.
Statsig.init("client-rfLvYGag3eyU0jYW5zcIJTQip7GXxSrhOFN69IGMjvq", {
  userID: "an_example_userid",
}).then(() => {
  // Check Gate
  const gate = Statsig.gate("a_gate");
  console.log("a_gate:", gate); // -> a_gate: true

  // Get Experiment
  const experiment = Statsig.experiment("an_experiment");
  console.log("an_experiment:", experiment); // -> an_experiment: { a_string: 'Experiment Test Value' }

  // Log a Custom Event
  Statsig.log("my_custom_event", 1.23, { custom_metadata: "foo" });

  // (Optional) Manually Flush to Statsig
  Statsig.flush();
});
```
