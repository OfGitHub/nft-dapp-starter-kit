import { NextPage } from "next";
import styles from "@styles/Mint.module.css";
import { Button, Spinner, VStack } from "@chakra-ui/react";
import { useAccount, useContractWrite } from "wagmi";
import NonFungibleCoinbae from "@data/NonFungibleCoinbae.json";
import { useEffect, useState } from "react";
import presaleList from "@data/allowlists/presaleList.json";

import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import Image from "next/image";
import web3 from "web3";
import { abridgeAddress } from "@utils/abridgeAddress";
import { generateMerkleProof } from "@utils/merkleProofs";
import ConnectWallet from "@components/web3/ConnectWallet";

const PRICE = 0.02;
const Mint: NextPage = () => {
  const [payable, setPayable] = useState(BigInt(20000000000000000).toString());
  const [merkleProof, setMerkleProof] = useState([""]);
  const [numPresaleMint, setNumPresaleMint] = useState(1);
  const handleChange = (value: number | string) =>
    setNumPresaleMint(Number(value));

  const { data: account, isError: accountIsError } = useAccount();

  const {
    data: presaleMintData,
    error: presaleError,
    isError: presaleMintIsError,
    isLoading: presaleMintIsLoading,
    write: presaleMintWrite,
  } = useContractWrite(
    {
      addressOrName: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
        ? process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
        : "0xCa4E3b3f98cCA9e801f88F13d1BfE68176a03dFA",
      contractInterface: NonFungibleCoinbae.abi,
    },
    "mintPreSale",
    {
      overrides: {
        value: payable,
      },
      args: [numPresaleMint, merkleProof],
      onError(error) {
        console.log(error);
      },
      onSuccess(data) {
        console.log("Success", data);
      },
    }
  );

  useEffect(() => {
    if (!accountIsError && account?.address) {
      const merkle = generateMerkleProof(presaleList, account.address);
      if (merkle.valid) {
        setMerkleProof(merkle.proof);
      } else {
        setMerkleProof([]);
      }
    }
  }, [account?.address]);

  const handleMint = async () => {
    const payableInEth = PRICE * numPresaleMint;
    const payableinWei = web3.utils.toWei(payableInEth.toString(10), "ether");
    setPayable(payableinWei);
    await presaleMintWrite();
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>
            Non-fungible Coinbaes
            <br />
            ?????? Pre-sale Minting Now ??????
          </h1>
          {account?.address ? (
            <VStack>
              <Image
                alt="placeholder image for team members"
                src={"/assets/landing/cbw.png"}
                width={250}
                height={250}
              />
              {/* select # of tokens to mint */}
              <NumberInput
                step={1}
                defaultValue={1}
                min={0}
                max={3}
                onChange={handleChange}
                inputMode="numeric"
                variant="filled"
              >
                <NumberInputField
                  _focus={{ bg: "white.300" }}
                  _active={{ bg: "white.300" }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Button
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  color: "#4b4f56",
                  borderRadius: "0",
                }}
                onClick={handleMint}
              >
                Mint Pre-sale
                {presaleMintIsLoading && <Spinner marginLeft={2} />}
              </Button>
              {presaleMintData && (
                <p style={{ color: "white" }}>
                  Success:{" "}
                  <a
                    href={`${
                      process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ||
                      "https://rinkeby.etherscan.io"
                    }/tx/${presaleMintData.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {abridgeAddress(presaleMintData.hash)}
                  </a>
                </p>
              )}
              {presaleMintIsError && (
                <p style={{ color: "red" }}>
                  Error:{" "}
                  {presaleError?.message.includes("Max tokens to mint") &&
                    "Minted max tokens"}
                  {presaleError?.message.includes("not open") &&
                    "Presale is currently closed"}
                  {presaleError?.message.includes("insufficient funds") &&
                    "Insufficient funds"}
                  {presaleError?.message.includes(
                    "Insufficient tokens remaining"
                  ) && "The collection has fully minted"}
                  {presaleError?.message.includes(
                    "Address does not exist in list"
                  ) && "This address is not in the presale list"}
                  {presaleError?.message.includes("User rejected request") &&
                    "User rejected request"}
                </p>
              )}
            </VStack>
          ) : (
            <VStack>
              <Image
                alt="placeholder image for team members"
                src={"/assets/team/cb.png"}
                width={250}
                height={250}
              />
              <p style={{ color: "white" }}>
                Connect wallet to check eligibility!
              </p>
              <ConnectWallet />
            </VStack>
          )}
        </main>
      </div>
    </div>
  );
};

export default Mint;
