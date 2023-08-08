import './App.css'

import { merge } from '../../../src'
import { twMerge } from 'tailwind-merge'

function App() {

  return (
    <>
      <h1 className="px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 p-3 bg-[#FF1C1C] text-lg/10">
        Default behavior
      </h1>
      <h1 className={merge("px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 p-3 bg-[#FF1C1C] text-lg/10")}>
        With merge
      </h1>
      <h1 className={twMerge("px-2 py-1 bg-red-300 hover:bg-blue-300", "!p-5 p-3 bg-[#FF1C1C] text-lg/10")}>
        With twMerge
      </h1>
    </>
  )
}

export default App
