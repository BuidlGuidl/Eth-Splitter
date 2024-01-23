import Head from "next/head";
import type { NextPage } from "next";
import Landing from "~~/components/Landing";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>ETH & Token Splitter</title>
        <meta name="description" content="Created with 🏗 scaffold-eth-2" />
      </Head>
      <Landing />
    </>
  );
};

export default Home;
