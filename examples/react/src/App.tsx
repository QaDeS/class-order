import './App.css'

import { forceMerge, merge } from 'class-order'
import { twMerge } from 'tailwind-merge'

function App() {

  return (
    <>
      <h1 className="text-4xl">Complete masking</h1>
      <h1 className="m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 p-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]">
        Default behavior
      </h1>
      <h1 className={forceMerge("m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 p-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]")}>
        With forceMerge
      </h1>
      <h1 className={merge("m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 p-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]")}>
        With merge
      </h1>
      <h1 className={twMerge("m-1 px-2 py-1 bg-red-300 hover:bg-blue-300", "!p-5 p-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]")}>
        With twMerge
      </h1>

      <h1 className="text-4xl">Partial masking</h1>
      <h1 className="m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 px-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]">
        Default behavior
      </h1>
      <h1 className={forceMerge("m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 px-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]")}>
        With forceMerge
      </h1>
      <h1 className={merge("m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 px-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]")}>
        With merge
      </h1>
      <h1 className={twMerge("m-1 px-2 py-1 bg-red-300 hover:bg-blue-300", "!p-5 px-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]")}>
        With twMerge
      </h1>
    </>
  )
}

export default App
