<script>
    import { classOrder } from '../../../../src'
    import { twMerge } from 'tailwind-merge'
</script>

<h1 class="m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 p-3 bg-[#FF1C1C] text-lg/10 [margin:2rem]">
  Default behavior
</h1>
<h1 use:classOrder class="m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 p-3 bg-[#FF1C1C] text-lg/10 [margin:2rem]">
    With use:classOrder
</h1>
<h1 class={twMerge("m-1 px-2 py-1 bg-red-300 hover:bg-blue-300", "!p-5 p-3 bg-[#FF1C1C] text-lg/10 [margin:2rem]")}>
  With twMerge
</h1>
