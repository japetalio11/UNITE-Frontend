export type SiteConfig = typeof siteConfig;

export const siteConfig = {
    name: "UNITE",
    description: "It's not another health tech platform, it's a movement.",
    navItems: [
        {
            label: "Resources",
            href: "/",
        },
        {
            label: "Product",
            href: "/docs",
        },
        {
            label: "Pricing",
            href: "/pricing",
        }
    ],
    navMenuItems: [
        {
            label: "Resources",
            href: "/",
        },
        {
            label: "Product",
            href: "/docs",
        },
        {
            label: "Pricing",
            href: "/pricing",
        }
    ],
    links: {
        github: "https://github.com/heroui-inc/heroui",
        twitter: "https://twitter.com/hero_ui",
        docs: "https://heroui.com",
        discord: "https://discord.gg/9b6yyZKmH4",
        sponsor: "https://patreon.com/jrgarciadev",
    },
};
