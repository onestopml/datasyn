import dynamic from "next/dynamic";

const HomeScreen = dynamic(
  () => import("../src/screens/Home").then((mod) => mod.HomeScreen),
  {
    ssr: false,
  }
);
const HomePage = () => {
  return <HomeScreen></HomeScreen>;
};
export default HomePage;
export const getServerSideProps = () => {
  return {
    props: {
      work: true,
    },
  };
};
