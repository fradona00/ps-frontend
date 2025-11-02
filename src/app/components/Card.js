import Image from "next/image";

export default function Card(params){
    const srcImage = params.srcImage;
    const title = params.title;
    const text = params.text;

    return (
        <div className="bg-[#102E7A] mx-auto lg:w-[422px] flex flex-col items-center rounded-4xl drop-shadow-2xl shadow-2xl py-2 lg:mx-2 mb-6 lg:mb-0">
            <Image className="" alt="cardImage" src={srcImage} width={200}/>
            <p className="text-4xl text-[#F7F7F7] font-[oswald] mb-2 font-bold text-center">{title}</p>
            <p className="text-xl/relaxed px-10 text-center text-[#F7F7F7] my-2 font-light">{text}</p>
        </div>
    );
}