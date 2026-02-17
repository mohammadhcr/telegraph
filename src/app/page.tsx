import { Workbox } from "workbox-window";

const Home = () => {
  if ("serviceWorker" in navigator) {
    const wb = new Workbox("/sw.js");
    wb.register();
  }

  return <div>page</div>;
};

export default Home;
