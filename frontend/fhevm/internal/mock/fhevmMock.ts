//////////////////////////////////////////////////////////////////////////
//
// WARNING!!
// ALWAYS DYNAMICALLY IMPORT THIS FILE TO AVOID INCLUDING THE ENTIRE 
// FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
//
//////////////////////////////////////////////////////////////////////////

import { JsonRpcProvider, Contract } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import { FhevmInstance } from "../../fhevmTypes";

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  const provider = new JsonRpcProvider(parameters.rpcUrl);

  // Resolve EIP712 domain for InputVerifier to ensure verifyingContract address matches
  const inputVerifier = new Contract(
    parameters.metadata.InputVerifierAddress,
    [
      "function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])",
    ],
    provider
  );
  const domain = await inputVerifier.eip712Domain();
  const verifyingContractAddressInputVerification = domain[4] as `0x${string}`;

  const config = {
    aclContractAddress: parameters.metadata.ACLAddress as `0x${string}`,
    chainId: parameters.chainId,
    gatewayChainId: 55815,
    inputVerifierContractAddress: parameters.metadata.InputVerifierAddress as `0x${string}`,
    kmsContractAddress: parameters.metadata.KMSVerifierAddress as `0x${string}`,
    verifyingContractAddressDecryption:
      "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64" as `0x${string}`,
    verifyingContractAddressInputVerification,
  };

  const instance = await MockFhevmInstance.create(provider, provider, config, {
    inputVerifierProperties: {},
    kmsVerifierProperties: {},
  });

  return (instance as unknown) as FhevmInstance;
};

