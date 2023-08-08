# Comparing `class-order` and `tailwind-merge`

Both `class-order` and `tailwind-merge` are tools that assist developers in managing CSS class concatenation and precedence. However, they differ in their usage and capabilities. Here, we'll explore the key differences between the two:


### Usage

`class-order` takes a single string of space-separated class names and arranges them in the order they appear. If you want to use class-order as a drop-in replacement, you can wrap the arguments in an array.

Example usage in React:

```jsx
import { merge } from 'class-order';

<div className={merge([
    "classA classB",
    "..."])} /* other props */>
  {/* Your component content */}
</div>
```


### Arbitrary Properties and Variants

`class-order` is not confined to any specific framework or CSS framework. It offers a distinct advantage over `tailwind-merge` by providing full support for arbitrary properties and variants out-of-the-box. While `tailwind-merge` is tailored specifically to the Tailwind CSS framework, `class-order` is designed to work with any CSS classes, regardless of their origin or structure. This makes it a versatile choice for projects that involve a variety of CSS libraries and custom styles.


### Universal Integration

`class-order` can be seamlessly integrated Svelte projects or other frameworks allowing for using directives. without the constraints of framework-specific limitations. Whether you're building a React application or using Svelte components, you can incorporate `class-order` effortlessly and benefit from its unique approach to class precedence.


### SSR Considerations

*Currently, SSR support is not yet implemented!*

It's important to note that due to its reliance on fully rendered CSS, `class-order` may require additional resources for server-side rendering (SSR) support, or considerably more and dependencies time in the build step. While the library is implemented to work on the actual CSS output of your project, this aspect could impact performance and/or bundle size when implementing SSR.


## Conclusion

While `tailwind-merge` remains a valuable tool for Tailwind CSS users, `class-order` introduces a generic approach on class precedence that caters to broader use cases and customization needs. By offering support for arbitrary properties, variants, and a novel approach to class ordering, `class-order` stands as an innovative choice for developers seeking a versatile solution for managing CSS class precedence in their projects.
