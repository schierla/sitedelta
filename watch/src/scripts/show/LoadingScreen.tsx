import { h } from "../hooks/h";
import { HighlightIcon } from "../icons/HighlightIcon";

export const LoadingScreen = () =>
  h(
    <div class="absolute inset-0 bg-gray-50">
      <div class="animate-pulse bg-gradient-to-r from-transparent via-indigo-500 absolute inset-x-0 top-0 h-1"></div>
      <div class="animate-ping text-5xl absolute left-1/2 top-1/2">
        <span class="-translate-x-1/2 -translate-y-1/2">
          <HighlightIcon />
        </span>
      </div>
    </div>
  );
