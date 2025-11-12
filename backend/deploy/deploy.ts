import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedHonor = await deploy("HonorNFT", {
    from: deployer,
    log: true,
  });

  const deployedLearningTest = await deploy("LearningTest", {
    from: deployer,
    args: [deployedHonor.address],
    log: true,
  });

  // Set LearningTest contract as authorized minter for HonorNFT
  const honorNFT = await hre.ethers.getContractAt("HonorNFT", deployedHonor.address);
  const setMinterTx = await honorNFT.setAuthorizedMinter(deployedLearningTest.address);
  await setMinterTx.wait();
  console.log(`Set LearningTest (${deployedLearningTest.address}) as authorized minter for HonorNFT`);

  console.log(`HonorNFT contract: `, deployedHonor.address);
  console.log(`LearningTest contract: `, deployedLearningTest.address);
};
export default func;
func.id = "deploy_learningTest"; // id required to prevent reexecution
func.tags = ["LearningTest"];

