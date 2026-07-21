import { clsx } from "clsx";
import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { jsx, jsxs } from "react/jsx-runtime";
import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { Separator } from "@base-ui/react/separator";
import { Tooltip } from "@base-ui/react/tooltip";
import { Menu } from "@base-ui/react/menu";
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/ui/dock.tsx
var DEFAULT_SIZE = 40;
var DEFAULT_MAGNIFICATION = 60;
var DEFAULT_DISTANCE = 140;
var DEFAULT_DISABLEMAGNIFICATION = false;
var dockVariants = cva("supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto mt-8 flex h-[58px] w-max items-center justify-center gap-2 rounded-2xl border p-2 backdrop-blur-md");
var Dock = React.forwardRef(({ className, children, iconSize = DEFAULT_SIZE, iconMagnification = DEFAULT_MAGNIFICATION, disableMagnification = DEFAULT_DISABLEMAGNIFICATION, iconDistance = DEFAULT_DISTANCE, direction = "middle", ...props }, ref) => {
	const mouseX = useMotionValue(Infinity);
	const renderChildren = () => {
		return React.Children.map(children, (child) => {
			if (React.isValidElement(child) && child.type === DockIcon) return React.cloneElement(child, {
				...child.props,
				mouseX,
				size: iconSize,
				magnification: iconMagnification,
				disableMagnification,
				distance: iconDistance
			});
			return child;
		});
	};
	return /* @__PURE__ */ jsx(motion.div, {
		ref,
		onMouseMove: (e) => mouseX.set(e.pageX),
		onMouseLeave: () => mouseX.set(Infinity),
		...props,
		className: cn(dockVariants({ className }), {
			"items-start": direction === "top",
			"items-center": direction === "middle",
			"items-end": direction === "bottom"
		}),
		children: renderChildren()
	});
});
Dock.displayName = "Dock";
var DockIcon = ({ size = DEFAULT_SIZE, magnification = DEFAULT_MAGNIFICATION, disableMagnification, distance = DEFAULT_DISTANCE, mouseX, className, children, ...props }) => {
	const ref = useRef(null);
	const padding = Math.max(6, size * .2);
	const defaultMouseX = useMotionValue(Infinity);
	const distanceCalc = useTransform(mouseX ?? defaultMouseX, (val) => {
		const bounds = ref.current?.getBoundingClientRect() ?? {
			x: 0,
			width: 0
		};
		return val - bounds.x - bounds.width / 2;
	});
	const targetSize = disableMagnification ? size : magnification;
	const scaleSize = useSpring(useTransform(distanceCalc, [
		-distance,
		0,
		distance
	], [
		size,
		targetSize,
		size
	]), {
		mass: .1,
		stiffness: 150,
		damping: 12
	});
	return /* @__PURE__ */ jsx(motion.div, {
		ref,
		style: {
			width: scaleSize,
			height: scaleSize,
			padding
		},
		className: cn("flex aspect-square cursor-pointer items-center justify-center rounded-full", disableMagnification && "hover:bg-muted-foreground transition-colors", className),
		...props,
		children
	});
};
DockIcon.displayName = "DockIcon";
//#endregion
//#region src/components/ui/separator.tsx
function Separator$1({ className, orientation = "horizontal", ...props }) {
	return /* @__PURE__ */ jsx(Separator, {
		"data-slot": "separator",
		orientation,
		className: cn("shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch", className),
		...props
	});
}
//#endregion
//#region src/components/ui/tooltip.tsx
function TooltipProvider({ delay = 0, ...props }) {
	return /* @__PURE__ */ jsx(Tooltip.Provider, {
		"data-slot": "tooltip-provider",
		delay,
		...props
	});
}
function Tooltip$1({ ...props }) {
	return /* @__PURE__ */ jsx(Tooltip.Root, {
		"data-slot": "tooltip",
		...props
	});
}
function TooltipTrigger({ ...props }) {
	return /* @__PURE__ */ jsx(Tooltip.Trigger, {
		"data-slot": "tooltip-trigger",
		...props
	});
}
function TooltipContent({ className, side = "top", sideOffset = 4, align = "center", alignOffset = 0, children, ...props }) {
	return /* @__PURE__ */ jsx(Tooltip.Portal, { children: /* @__PURE__ */ jsx(Tooltip.Positioner, {
		align,
		alignOffset,
		side,
		sideOffset,
		className: "isolate z-50",
		children: /* @__PURE__ */ jsxs(Tooltip.Popup, {
			"data-slot": "tooltip-content",
			className: cn("z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
			...props,
			children: [children, /* @__PURE__ */ jsx(Tooltip.Arrow, { className: "z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" })]
		})
	}) });
}
//#endregion
//#region src/components/ui/dropdown-menu.tsx
function DropdownMenu({ ...props }) {
	return /* @__PURE__ */ jsx(Menu.Root, {
		"data-slot": "dropdown-menu",
		...props
	});
}
function DropdownMenuTrigger({ ...props }) {
	return /* @__PURE__ */ jsx(Menu.Trigger, {
		"data-slot": "dropdown-menu-trigger",
		...props
	});
}
function DropdownMenuContent({ align = "start", alignOffset = 0, side = "bottom", sideOffset = 4, className, ...props }) {
	return /* @__PURE__ */ jsx(Menu.Portal, { children: /* @__PURE__ */ jsx(Menu.Positioner, {
		className: "isolate z-50 outline-none",
		align,
		alignOffset,
		side,
		sideOffset,
		children: /* @__PURE__ */ jsx(Menu.Popup, {
			"data-slot": "dropdown-menu-content",
			className: cn("z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95", className),
			...props
		})
	}) });
}
//#endregion
export { TooltipContent as a, Separator$1 as c, Tooltip$1 as i, Dock as l, DropdownMenuContent as n, TooltipProvider as o, DropdownMenuTrigger as r, TooltipTrigger as s, DropdownMenu as t, DockIcon as u };
