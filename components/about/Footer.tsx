// "use client";

// import {
//   Text,
//   Container,
//   ActionIcon,
//   Group,
//   rem,
//   Image,
//   Space,
// } from "@mantine/core";
// import {
//   IconBrandTwitter,
//   IconBrandYoutube,
//   IconBrandInstagram,
// } from "@tabler/icons-react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import classes from "./Footer.module.css";
// import { logo } from "@/lib/constants";

// const data = [
//   {
//     title: "About",
//     links: [
//       { label: "Mission", link: "/about" },
//       { label: "Support", link: "/support" },
//     ],
//   },
//   {
//     title: "Project",
//     links: [
//       { label: "Contribute", link: "#" },
//       { label: "Media assets", link: "#" },
//     ],
//   },
//   {
//     title: "Community",
//     links: [
//       { label: "Follow on TikTok", link: "#" },
//       { label: "Follow on Twitter", link: "#" },
//       { label: "Email newsletter", link: "#" },
//     ],
//   },
// ];

// export function Footer({ fullWidth = false }: { fullWidth?: boolean }) {
//   const router = useRouter();
//   const groups = data.map((group) => {
//     const links = group.links.map((link, index) => (
//       <Link
//         key={index}
//         className={classes.link}
//         component="a"
//         href={link.link}
//         onClick={(event) => event.preventDefault()}
//       >
//         {link.label}
//       </Link>
//     ));

//     return (
//       <div className={classes.wrapper} key={group.title}>
//         <Text className={classes.title}>{group.title}</Text>
//         {links}
//       </div>
//     );
//   });

//   return (
//     <footer
//       className={classes.footer}
//       style={{ marginLeft: fullWidth ? "auto" : rem(250) }}
//     >
//       <Space h="lg" />
//       <Container className={classes.inner}>
//         <div className={classes.logo}>
//           <img
//             src={"/logo.svg" || logo}
//             height={150}
//             width="auto"
//             onClick={() => router.push("/")}
//             alt="chachingsocial-logo"
//             className={classes.logo}
//           />
//           {/*<MantineLogo size={30} />*/}
//           <Text size="xs" c="dimmed" className={classes.description}>
//             {/* eslint-disable-next-line max-len */}
//             Fostering an open dialogue about money and working towards a more
//             equitable future.
//           </Text>
//         </div>
//         <div className={classes.groups}>{groups}</div>
//       </Container>
//       <Container className={classes.afterFooter}>
//         <Text c="dimmed" size="sm">
//           ©2025 ChaChing Social. All rights reserved.
//         </Text>

//         <Group
//           gap={0}
//           className={classes.social}
//           justify="flex-end"
//           wrap="nowrap"
//         >
//           <ActionIcon size="lg" color="gray" variant="subtle">
//             <IconBrandTwitter
//               style={{ width: rem(18), height: rem(18) }}
//               stroke={1.5}
//             />
//           </ActionIcon>
//           <ActionIcon size="lg" color="gray" variant="subtle">
//             <IconBrandYoutube
//               style={{ width: rem(18), height: rem(18) }}
//               stroke={1.5}
//             />
//           </ActionIcon>
//           <ActionIcon size="lg" color="gray" variant="subtle">
//             <IconBrandInstagram
//               style={{ width: rem(18), height: rem(18) }}
//               stroke={1.5}
//             />
//           </ActionIcon>
//         </Group>
//       </Container>
//     </footer>
//   );
// }

