import dynamic from "next/dynamic";

const ProjectScreen = dynamic(
  () => import("../../src/screens/Project").then((mod) => mod.ProjectScreen),
  {
    ssr: false,
  }
);
const ProjectPage = () => {
  return <ProjectScreen></ProjectScreen>;
};
export default ProjectPage;
export const getServerSideProps = () => {
  return {
    props: {
      work: true,
    },
  };
};
