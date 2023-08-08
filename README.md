# class-order

`class-order` is a JavaScript library that provides a unique approach to CSS class precedence, allowing HTML developers to control class precedence based on the order of classes within the `class` attribute. This library is designed to offer an alternative to the traditional method where CSS rules defined later in the source override earlier rules.

## Installation

*WIP: For now, it's best to git clone and then link to `class-order/src/index.ts`*
You can install the library using npm:

```sh
npm install class-order
```

## Usage

### React

In React applications, you can use the `merge` function from the `class-order` library to control class precedence. Here's an example of how to use it:

```jsx
import { merge } from 'class-order';

// ...

<div className={merge("classA classB ...")} /* other props */>
  {/* Your component content */}
</div>
```

`merge` takes a space-separated list of class names and arranges them in the order they appear within the `class` attribute.

### Svelte

For Svelte applications, you can use the `classOrder` directive provided by the `class-order` library. Here's an example of how to use it:

```svelte
<script>
  import { classOrder } from 'class-order';
</script>

<div use:classOrder class="classA classB ..." /* other props */>
  <!-- Your component content -->
</div>
```

`classOrder` ensures that classes are applied in the order they appear within the `class` attribute.

## Why Use `class-order`?

- **Fine-grained Control:** With `class-order`, you can explicitly determine class precedence by the order of classes in the `class` attribute.

- **Drop-in Replacement:** The library is designed to be a seamless replacement for `twMerge` in Tailwind CSS setups and can be easily integrated into existing projects. For a detailed comparison between `class-order` and `tailwind-merge`, check out [vs_twMerge.md](./vs_twMerge.md).

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Give `class-order` a try and take control of CSS class precedence like never before! If you have any questions, feedback, or concerns, don't hesitate to reach out.
