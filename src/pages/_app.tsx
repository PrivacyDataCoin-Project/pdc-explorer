import { StoreProvider } from "@/store/store-reducer";
import "./index.scss";
import "leaflet/dist/leaflet.css";
import { AppProps } from "next/app";
import Head from "next/head";
import NetMode from "@/interfaces/common/NetMode";
import Layout from "./Layout";

interface AppCustomProps extends AppProps {
  netMode: NetMode;
}

function App(data: AppCustomProps) {
  const { Component, pageProps, netMode } = data;
  return (
    <>
      <Head>
        <title>PDC Explorer</title>
        <meta
          name="description"
          content="Privacy Data Coin (PDC) block explorer. Addresses start with Px. Block reward is 1 PDC, target about 60 seconds, no premine."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1  user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://privacydatacoin.com/" />
        <meta property="og:title" content="PDC Block Explorer" />
        <meta
          property="og:description"
          content="Privacy Data Coin (PDC) block explorer. Addresses start with Px. Block reward is 1 PDC, target about 60 seconds, no premine."
        />
        <meta
          property="og:image"
          content={
            netMode === "MAIN"
              ? "social-banner.png"
              : "social-banner-testnet.png"
          }
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://privacydatacoin.com/" />
        <meta property="twitter:title" content="PDC Block Explorer" />
        <meta
          property="twitter:description"
          content="Privacy Data Coin (PDC) block explorer. Addresses start with Px. Block reward is 1 PDC, target about 60 seconds, no premine."
        />
        <meta
          property="twitter:image"
          content={
            netMode === "MAIN"
              ? "social-banner.png"
              : "social-banner-testnet.png"
          }
        />
      </Head>
      <StoreProvider
        initial={{ netMode: netMode === "TEST" ? "TEST" : "MAIN" }}
      >
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </StoreProvider>
    </>
  );
}

App.getInitialProps = async () => {
  return {
    netMode: process.env.NET_MODE === "TEST" ? "TEST" : ("MAIN" as NetMode),
  };
};

export default App;
