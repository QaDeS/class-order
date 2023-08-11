<script>
    import { classOrder } from 'class-order/tailwind-merge'
</script>

<h1 class="text-4xl">Full masking</h1>
<h1 class="m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 p-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]">
  Default behavior
</h1>
<h1 use:classOrder class={["m-1 px-2 py-1 bg-red-300 hover:bg-blue-300", "!p-5 p-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]"]}>
  With twMerge
</h1>

<h1 class="text-4xl">Partial masking</h1>
<h1 class="m-1 px-2 py-1 bg-red-300 hover:bg-blue-300 !p-5 px-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]">
  Default behavior
</h1>
<h1 use:classOrder class={["m-1 px-2 py-1 bg-red-300 hover:bg-blue-300",
  "!p-5 px-1 bg-[#FF1C1C] text-lg/10 [margin:2rem]"]}>
  With twMerge
</h1>
