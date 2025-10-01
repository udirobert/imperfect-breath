/**
 * Footer Component - Simple social media links
 * Clean, centered design following DRY principles
 */

import React from "react";
import { Twitter, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface SocialLink {
  name: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  handle: string;
}

const socialLinks: SocialLink[] = [
  {
    name: "Twitter",
    url: "https://twitter.com/papajimjams",
    icon: Twitter,
    handle: "@papajimjams",
  },
  {
    name: "Lens",
    url: "https://hey.xyz/u/papajams",
    icon: ExternalLink,
    handle: "papajams",
  },
  {
    name: "Farcaster",
    url: "https://farcaster.xyz/papa",
    icon: ExternalLink,
    handle: "papa",
  },
];

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-4">
          {/* Social Links */}
          <div className="flex items-center gap-6">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                  aria-label={`Follow on ${link.name}`}
                >
                  <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">{link.handle}</span>
                </a>
              );
            })}
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <Link
              to="/terms"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>
            <span>•</span>
            <a
              href="mailto:privacy@imperfectform.fun"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Contact
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Imperfect Breath. Made with ❤️ for
              mindful breathing.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
