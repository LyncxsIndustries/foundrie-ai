"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "FREE",
    price: "$0",
    period: "forever",
    description: "Perfect for solo developers exploring Foundrie",
    features: [
      "3 projects",
      "Full diagram suite (12 types)",
      "AI discovery & architecture",
      "Context file generation",
      "Feature spec generation",
      "ZIP export",
      "Community support",
    ],
    cta: "Get Started",
    href: "/sign-up",
  },
  {
    name: "PRO",
    price: "$29",
    period: "per month",
    description: "For professional developers building serious products",
    features: [
      "Unlimited projects",
      "Priority model routing (Claude Sonnet 4)",
      "Real-time collaboration",
      "Advanced diagram editing",
      "Research library with visual analysis",
      "Project-specific agent skills",
      "Email support",
    ],
    cta: "Start Free Trial",
    href: "/sign-up",
    highlighted: true,
  },
  {
    name: "TEAM",
    price: "$99",
    period: "per month",
    description: "For teams that ship together",
    features: [
      "Everything in PRO",
      "Up to 10 team members",
      "Shared project workspaces",
      "Role-based access control",
      "Team usage analytics",
      "Priority support",
      "Custom integrations",
    ],
    cta: "Start Free Trial",
    href: "/sign-up",
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    period: "contact sales",
    description: "For organizations with advanced needs",
    features: [
      "Everything in TEAM",
      "Unlimited team members",
      "SSO & advanced security",
      "Dedicated support",
      "Custom model fine-tuning",
      "On-premise deployment option",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    href: "/sign-up",
  },
];

export function PricingTable() {
  return (
    <div className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-text-primary md:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-text-secondary">
            Choose the plan that fits your workflow. All plans include the full
            Foundrie experience.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg border p-8 ${
                tier.highlighted
                  ? "border-accent-primary bg-surface shadow-lg"
                  : "border-border bg-surface"
              }`}
            >
              <h3 className="text-lg font-semibold text-text-primary">
                {tier.name}
              </h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-text-primary">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="ml-2 text-text-secondary">
                    {tier.period}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm text-text-secondary">
                {tier.description}
              </p>
              <Link href={tier.href} className="mt-6 block">
                <Button
                  className="w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                >
                  {tier.cta}
                </Button>
              </Link>
              <ul className="mt-8 space-y-3">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-accent-primary" />
                    <span className="text-sm text-text-secondary">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
