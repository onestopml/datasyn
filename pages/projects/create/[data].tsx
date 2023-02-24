import dynamic from "next/dynamic";

const ProjectCreateScreen = dynamic(
  () =>
    import("../../../src/screens/ProjectCreate").then(
      (mod) => mod.ProjectCreateScreen
    ),
  {
    ssr: false,
  }
);
const ProjectCreatePage = () => {
  return <ProjectCreateScreen></ProjectCreateScreen>;
};
export default ProjectCreatePage;
export const getServerSideProps = () => {
  return {
    props: {
      work: true,
    },
  };
};
