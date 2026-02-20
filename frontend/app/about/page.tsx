"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Award,
  Users,
  ShoppingBag,
  Shield,
  Heart,
  Star,
  Clock,
  CreditCard,
  Globe,
  Target,
  Eye,
  Zap,
} from "lucide-react";
import { useIsDarkMode } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  const isDarkMode = useIsDarkMode();

  const theme = {
    bg: {
      primary: isDarkMode ? "var(--color-gray-800)" : "white",
      secondary: isDarkMode ? "var(--color-gray-700)" : "var(--color-gray-50)",
      card: isDarkMode ? "var(--color-gray-800)" : "white",
      hover: isDarkMode ? "var(--color-gray-700)" : "var(--color-gray-100)",
    },
    text: {
      primary: isDarkMode ? "white" : "var(--color-gray-900)",
      secondary: isDarkMode ? "var(--color-gray-400)" : "var(--color-gray-600)",
      muted: isDarkMode ? "var(--color-gray-500)" : "var(--color-gray-400)",
    },
    border: {
      default: isDarkMode ? "var(--color-gray-700)" : "var(--color-gray-200)",
    },
  };

  const stats = [
    { value: "5K+", label: "Happy Customers", icon: Users },
    { value: "10K+", label: "Products Sold", icon: ShoppingBag },
    { value: "11+", label: "Years in Engineering", icon: Award },
    { value: "24/7", label: "Customer Support", icon: Clock },
  ];

  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description: "I put my customers at the heart of everything I do.",
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Your security is My priority with safe transactions.",
    },
    {
      icon: Zap,
      title: "Fast Delivery",
      description: "Quick and reliable shipping to your doorstep.",
    },
    {
      icon: Star,
      title: "Quality Assured",
      description: "I guarantee the highest quality products.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Serving customers worldwide with ease.",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Multiple secure payment options for your convenience.",
    },
  ];

  const team = [
    {
      name: "Haftamu",
      role: "CEO & Founder",
      image: "/team/team-1.jpg",
      bio: "10+ years in Engineering",
    },
    {
      name: "Desta",
      role: "CTO",
      image: "/team/team-2.jpg",
      bio: "Tech innovator and full-stack expert",
    },
    {
      name: "Yemata",
      role: "Head of Operations",
      image: "/team/team-3.jpg",
      bio: "Supply chain optimization specialist",
    },
    {
      name: "Getahun",
      role: "Customer Experience",
      image: "/team/team-4.jpg",
      bio: "Dedicated to customer satisfaction",
    },
  ];

  const milestones = [
    {
      year: "2012",
      title: "Graduated from MIT",
      description: "Earned degree in Electrical and Electronics Engineering",
    },
    {
      year: "2015",
      title: "Graduated from AAiT",
      description:
        "Completed advanced studies in Engineering while working as Electrical Engineer",
    },
    {
      year: "2022",
      title:
        "Started learning Full stack web development(Ruby On Rails Based) at Microverse",
      description:
        "Embarked on an intensive remote learning journey at Microverse, mastering Ruby on Rails and full-stack development while collaborating with international peers.  ",
    },
    {
      year: "2023",
      title: "Became Member of Microverse Alumni",
      description:
        "Successfully graduated from Microverse and joined the alumni network, gaining access to continued learning opportunities and a global community of developers.",
    },
    {
      year: "2025",
      title:
        "Started learning Full stack web development(Node.js/Python Based) at FreeeCodeCamp",
      description:
        "Expanding my skill set by diving into Node.js and Python through FreeCodeCamp's comprehensive curriculum, preparing for my next major career milestone.",
    },
  ];

  return (
    <div
      className="container-custom py-12"
      style={{
        background:
          "linear-gradient(145deg, #0a4b6e 0%, #1e6f9f 50%, #3b9bd7 100%)",
        color: "#fff",
      }}
    >
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          className="p-2 rounded-lg transition-colors"
          style={{
            color: theme.text.secondary,
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.bg.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <ArrowLeft className="w-5 h-5 bg-white" />
        </Link>
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: theme.text.primary }}
        >
          About Me
        </h1>
      </div>
      <div
        className="relative rounded-2xl overflow-hidden mb-12 p-12 md:p-16 text-center"
        style={{
          background: "#1e6f9f",
        }}
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Your Trusted Shopping Partner
        </h2>
        <p className="text-white/90 text-lg max-w-3xl mx-auto">
          I am on a mission to provide the best online shopping experience with
          quality products, fast delivery, and exceptional customer service.
        </p>
      </div>
      <Separator className="w-full mb-4 h-4 bg-linear-to-r from-transparent via-gray-400 to-transparent rounded-full" />
      <div
        className="grid lg:grid-cols-2 gap-12 mb-16 items-center"
        style={{
          background: "#0a4b6e",
          color: "#edf7ed",
        }}
      >
        <div>
          <h2 className="text-3xl font-bold mb-6">My Story</h2>
          <div className="space-y-4">
            <p className="leading-relaxed">
              I graduated from Mekele Institute of Technology in 2012 with a BSc
              in Electrical and Electronics Engineering, where I was honoured to
              be among the region's top scorers selected for a full scholarship.
            </p>
            <p className="leading-relaxed">
              In 2015, I earned my MSc in Electrical Engineering for Railway
              Systems from Addis Ababa Institute of Technology, furthering my
              expertise in specialised engineering applications. I was among the
              top 30 students selected for a full scholarship by the Ethiopian
              Railway Corporation.
            </p>
            <p className="leading-relaxed">
              While employed as an Electrical Engineer at Ethiopian Electric
              Power, I expanded my skillset by joining Microverse in 2022 to
              study Ruby on Rails-based full-stack web development.
            </p>
            <p>
              At present, I am expanding my technical skills through full-stack
              web development studies at FreeCodeCamp, focusing on Node.js and
              Python, while maintaining my position as an Electrical Engineer. I
              am currently building an e-commerce application to showcase my
              skills.
            </p>
          </div>

          <div className="flex gap-4 mt-8">
            <Link href="/dashboard/products">
              <Button className="btn-primary">Shop Now</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="btn-outline">
                Contact Me
              </Button>
            </Link>
          </div>
        </div>

        <div
          className="relative rounded-xl overflow-hidden aspect-square"
          style={{
            backgroundColor: theme.bg.secondary,
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src={"/images/haftamu_d.jpg"}
              alt="haftamu"
              width={340}
              height={340}
              style={{ color: "var(--color-primary-600)" }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="border text-center hover:shadow-lg transition-all hover:-translate-y-1"
              style={{
                background: "#1e6f9f",
              }}
            >
              <CardContent className="p-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))`,
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: "var(--color-primary-600)" }}
                  />
                </div>
                <h3
                  className="text-2xl font-bold mb-1"
                  style={{ color: theme.text.primary }}
                >
                  {stat.value}
                </h3>
                <p style={{ color: theme.text.secondary }}>{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="w-full mb-4 h-4 bg-linear-to-r from-transparent via-gray-400 to-transparent rounded-full" />

      <div className="mb-16">
        <div className="text-center mb-10">
          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: theme.text.primary }}
          >
            My Values
          </h2>
          <p className="text-lg max-w-2xl mx-auto">
            The principles that guide everything I do
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <Card
                key={index}
                className="border hover:shadow-lg transition-all hover:-translate-y-1"
                style={{
                  background: "#0a4b6e",
                  color: "#edf7ed",
                }}
              >
                <CardContent className="p-6">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      background: `linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))`,
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: "var(--color-primary-600)" }}
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p>{value.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Card
          className="border"
          style={{
            backgroundColor: "#2a3155",
            borderColor: theme.border.default,
          }}
        >
          <CardContent className="p-8">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Target
                className="w-6 h-6"
                style={{ color: "var(--color-primary-600)" }}
              />
            </div>
            <h3
              className="text-3xl font-bold mb-3"
              style={{ color: theme.text.primary }}
            >
              My Mission
            </h3>
            <p>
              To provide a seamless and enjoyable shopping experience by
              offering high-quality products, competitive prices, and
              exceptional customer service that exceeds expectations.
            </p>
          </CardContent>
        </Card>

        <Card
          className="border"
          style={{
            backgroundColor: "#2a3155",
            borderColor: theme.border.default,
          }}
        >
          <CardContent className="p-8">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Eye
                className="w-6 h-6"
                style={{ color: "var(--color-primary-600)" }}
              />
            </div>
            <h3
              className="text-3xl font-bold mb-3"
              style={{ color: theme.text.primary }}
            >
              My Vision
            </h3>
            <p>
              To become the most trusted and innovative e-commerce platform
              globally, connecting people with the products they love while
              fostering a community of satisfied customers and partners.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="w-full mb-4 h-4 bg-linear-to-r from-transparent via-gray-400 to-transparent rounded-full" />

      <div className="mb-16">
        <h2
          className="text-3xl font-bold text-center mb-10"
          style={{ color: theme.text.primary }}
        >
          My Journey
        </h2>

        <div className="relative">
          <div
            className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full"
            style={{ backgroundColor: theme.border.default }}
          />

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`relative flex items-center ${
                  index % 2 === 0 ? "justify-start" : "justify-end"
                }`}
              >
                <div className={`w-5/12 ${index % 2 === 0 ? "pr-8" : "pl-8"}`}>
                  <Card
                    className="border hover:shadow-lg transition-all"
                    style={{
                      backgroundColor: "#1c3b4f",
                    }}
                  >
                    <CardContent className="p-6">
                      <span
                        className="text-sm font-bold mb-2 inline-block"
                        style={{ color: "var(--color-primary-600)" }}
                      >
                        {milestone.year}
                      </span>
                      <h3 className="text-lg font-semibold mb-2">
                        {milestone.title}
                      </h3>
                      <p>{milestone.description}</p>
                    </CardContent>
                  </Card>
                </div>
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: "var(--color-primary-600)",
                    border: `2px solid ${theme.bg.primary}`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator className="w-full mb-4 h-4 bg-linear-to-r from-transparent via-gray-400 to-transparent rounded-full" />

      <div className="mb-16">
        <div className="text-center mb-10">
          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: theme.text.primary }}
          >
            Meet my Team
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: theme.text.secondary }}
          >
            The passionate people behind your shopping experience
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <Card
              key={index}
              className="border hover:shadow-lg transition-all"
              style={{
                backgroundColor: theme.bg.card,
                borderColor: theme.border.default,
              }}
            >
              <CardContent className="p-6 text-center">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))`,
                  }}
                >
                  <Users
                    className="w-10 h-10"
                    style={{ color: "var(--color-primary-600)" }}
                  />
                </div>
                <h3
                  className="font-semibold text-lg mb-1"
                  style={{ color: theme.text.primary }}
                >
                  {member.name}
                </h3>
                <p
                  className="text-sm mb-2"
                  style={{ color: "var(--color-primary-600)" }}
                >
                  {member.role}
                </p>
                <p style={{ color: theme.text.secondary }}>{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card
        className="border overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, #1b4d1b 0%, #2d6a2d 50%, #4f8a4f 100%)",
        }}
      >
        <CardContent className="p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Join thousands of satisfied customers and experience the best online
            shopping experience today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard/products">
              <Button size="lg" className="btn-primary min-w-50">
                Browse Products
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="btn-outline min-w-50"
              >
                Get in Touch
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
