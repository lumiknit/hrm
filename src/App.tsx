import { createSignal, type Component } from "solid-js";
import { Toaster } from "solid-toast";

const App: Component = () => {
  const [count, setCount] = createSignal(0);

  return (
    <>
      <Toaster />
      <h1>Hrm</h1>
      <button class="button primary" onClick={() => setCount(count() + 1)}>
        Count: {count()}
      </button>
    </>
  );
};

export default App;
