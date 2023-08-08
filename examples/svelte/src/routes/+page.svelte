<script>
    import { classOrder } from '../../../../src'
    import { twMerge } from 'tailwind-merge'
</script>

<h1 class="px-2 py-1 bg-red-300 hover:bg-blue-300 p-3 bg-[#FF1C1C]">
  Default behavior
</h1>
<h1 use:classOrder class="px-2 py-1 bg-red-300 hover:bg-blue-300 p-3 bg-[#FF1C1C]">
    With use:classOrder
</h1>
<h1 class={twMerge("px-2 py-1 bg-red-300 hover:bg-blue-300", "p-3 bg-[#FF1C1C]")}>
  With twMerge
</h1>
