/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { address, abi } from "../config";
import { ethers } from "ethers";
import axios from "axios";
import Link from "next/link";
import { useSelector } from "react-redux";
import LocationSvg from "../assets/images/location.png";
import Image from "next/image";
import counter from "../assets/images/counter.png";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Events() {
  const [items, setItems] = useState([]);

  // const [smartAcc, setSmartAcc] = useState();
  const smartAcc = useSelector((state) => state.login.smartAcc);
  const userInfo = useSelector((state) => state.login.userInfo);
  const [loading, setLoading] = useState(null)

  useEffect(() => {
    fetchEvents();
  }, []);

  const INFURA_ID = process.env.NEXT_PUBLIC_INFURA;
  const ALCHEMY_ID = process.env.NEXT_PUBLIC_ALCHEMY;
  const QUICKNODE_ID =process.env.NEXT_PUBLIC_QUICKNODE;

  const provider = new ethers.providers.JsonRpcProvider(
    `https://crimson-warmhearted-tab.matic-testnet.discover.quiknode.pro/${QUICKNODE_ID}`
    // `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_ID}`
    // `https://polygon-mumbai.infura.io/v3/${INFURA_ID}`
  );

  async function fetchEvents() {
    const contract = new ethers.Contract(address, abi, provider);
    const data = await contract.activeEvents();
    const itemsFetched = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await contract.uri(i.tokenId.toString());
        console.log(tokenUri);
        const meta = await axios.get(tokenUri + "/");
        // let price = ethers.utils.formatEther(i.price);
        let item = {
          // price,
          name: meta.data.name,
          cover: meta.data.cover,
          description: meta.data.description,
          date: meta.data.date,
          venue: meta.data.venue,
          supply: i.supply.toNumber(),
          tokenId: i.tokenId.toNumber(),
          remaining: i.remaining.toNumber(),
          host: i.host,
        };
        return item;
      })
    );

    setItems(itemsFetched);
    console.log(itemsFetched);
  }

  async function claim(prop) {
    setLoading(prop.tokenId)
    console.log("started");

    const _ticketId = prop.tokenId;
    const _email = userInfo.email;
    console.log(_email)
    console.log(_ticketId);

    const erc20Interface = new ethers.utils.Interface([
      "function claimTicket(uint256 _ticketId, string memory _email)",
    ]);

    const data = erc20Interface.encodeFunctionData("claimTicket", [_ticketId, _email]);

    const tx1 = {
      to: address,
      data,
    };

    smartAcc.on("txHashGenerated", (response) => {
      console.log("txHashGenerated event received via emitter", response);
    });
    smartAcc.on("onHashChanged", (response) => {
      console.log("onHashChanged event received via emitter", response);
    });
    smartAcc.on("txMined", (response) => {
      console.log("txMined event received via emitter", response);
    });
    smartAcc.on("error", (response) => {
      console.log("error event received via emitter", response);
    });

    // Sending gasless transaction
    const txResponse = await smartAcc.sendTransaction({
      transaction: tx1,
      // gasLimit: 1000000,
    });
    console.log("userOp hash", txResponse.hash);

    const txReceipt = await txResponse.wait();
    console.log("Tx hash", txReceipt.transactionHash);

    console.log(txResponse)
    console.log("done");
    toast.success('Claimed successfully', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        });
    setLoading(null)
  }

  function Card(prop) {
    const date = new Date(prop.date);
    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = date.toLocaleDateString(undefined, options);

    return (
      <div
        style={{ borderTopLeftRadius: 0 }}
        className="mx-auto bg-violet-800 w-3/4 flex py-10 rounded-[32px] relative right-10 mb-20"
      >
        <div className="w-full flex gap-8 items-center px-14">
          <div className="flex-1 flex max-w-[650px] items-center">
            <div className=" ">
              <h4 className="font-normal lg:text-[42px] text-[26px] text-white capitalize fancy-font">
                {prop.name}
              </h4>

              <p className="mt-[10px] font-normal lg:text-[20px] text-[14px] text-[#C6C6C6]">
                {prop.description}
              </p>

              <div
                onClick={() => claim(prop)}
                className="poin mt-4 rounded-3xl inline-flex items-center justify-center border border-transparent px-8 py-2 font-semibold text-md shadow-sm hover:bg-indigo-700 bg-white text-black"
              >
                {
                    prop.loading === prop.tokenId
                    ? <svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 text-black animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                                </svg>
                    : null
                    }
                <p>Claim</p>
              </div>
            </div>

            <div className="ml-20">
              <p className="text-sm">Join on-</p>
              <h2 className="tracking-widest text-indigo-xs title-font font-medium text-6xl uppercase text-white fancy-font">
                {formattedDate}
              </h2>

              <div className="flex gap-2 mt-8 ml-2">
                <div className="rounded-full p-1 border-white border w-8 h-8">
                  <Image src={LocationSvg} />
                </div>
                <a className="text-white inline-flex items-center md:mb-2 lg:mb-0">
                  {prop.venue}
                </a>
              </div>

              <div className="flex gap-2 mt-3 ml-2">
                <div className="rounded-full p-1 border-white border w-8 h-8">
                  <Image src={counter} />
                </div>

                <a className="text-white inline-flex items-center md:mb-2 lg:mb-0">
                  Remaining: {prop.remaining}
                </a>
              </div>
            </div>
          </div>
        </div>
        <img
          src={prop.cover}
          alt=""
          style={{ borderBottomRightRadius: 0 }}
          className="md:w-[270px] w-full h-[250px] rounded-[32px] object-cover relative translate-x-1/2"
        />
      </div>
    );
  }

  function debug1() {
    fetchEvents();
    console.log(items);
  }

  return (
    <div className="b">
        <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        />
        <h2 className="text-center text-4xl my-6 mb-7 mt-14">Featured Events</h2>
      {/* <p>events</p>
      <button onClick={debug1}>test 1</button> */}
      {items.map((item, i) => (
        <Card
          key={i}
          loading={loading}
          //   price={item.price}
          name={item.name}
          cover={item.cover}
          description={item.description}
          date={item.date}
          venue={item.venue}
          supply={item.supply}
          tokenId={item.tokenId}
          remaining={item.remaining}
          host={item.host}
        />
      ))}
    </div>
  );
}
