import './App.css'

import { merge } from '../../../src'
import { twMerge } from 'tailwind-merge'

function App() {

  return (
    <>
      <h1 className="m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 p-3 bg-[#FF1C1C] text-lg/10 [margin:2rem]">
        Default behavior
      </h1>
      <h1 className={merge("m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 p-3 bg-[#FF1C1C] text-lg/10 [margin:2rem]")}>
        With merge
      </h1>
      <h1 className={twMerge("m-1 px-2 py-1 bg-red-300 hover:bg-blue-300", "!p-5 p-3 bg-[#FF1C1C] text-lg/10 [margin:2rem]")}>
        With twMerge
      </h1>
    </>
  )
}

export default App
