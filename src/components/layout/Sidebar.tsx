import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ShoppingCart,
  ListChecks,
  Package,
  Boxes,
  FileText
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggleAccordionItem = (item: string) => {
    setExpanded((prevExpanded) =>
      prevExpanded.includes(item)
        ? prevExpanded.filter((i) => i !== item)
        : [...prevExpanded, item]
    );
  };

  const navigation = [
    {
      name: "Dashboard",
      items: [{ name: "Analytics", href: "/", icon: LayoutDashboard }],
    },
    {
      name: "Management",
      items: [
        { name: "Users", href: "/users", icon: Users },
        { name: "Orders", href: "/orders", icon: ShoppingCart },
        { name: "Catalog", href: "/catalog", icon: ListChecks },
      ],
    },
    {
      name: "Production",
      items: [
        { name: "Planning", href: "/planning", icon: Calendar },
        { name: "Cutting", href: "/cutting", icon: Package },
        { name: "Printing", href: "/printing", icon: Boxes },
        { name: "Dispatch", href: "/dispatch", icon: Package },
      ],
    },
    {
      name: "Sales",
      items: [
        { name: "Sales Bills", href: "/sales/bills", icon: FileText },
      ]
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r py-4 dark:bg-secondary">
      <div className="px-6 mb-4">
        <Button variant="ghost" className="w-full justify-start font-normal" onClick={() => navigate("/")}>
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>
      <div className="space-y-1">
        {navigation.map((section) => (
          <Accordion
            type="single"
            collapsible
            key={section.name}
            value={expanded.includes(section.name) ? section.name : undefined}
            onValueChange={() => toggleAccordionItem(section.name)}
          >
            <AccordionItem value={section.name}>
              <AccordionTrigger className="px-6 font-medium">{section.name}</AccordionTrigger>
              <AccordionContent className="pl-4">
                {section.items.map((item) => (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal",
                      location.pathname === item.href
                        ? "bg-accent dark:bg-secondary/50"
                        : "hover:bg-accent hover:dark:bg-secondary/50"
                    )}
                    key={item.name}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    <span>{item.name}</span>
                  </Button>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
      <div className="mt-auto px-6 pt-4">
        <ModeToggle settheme={setTheme} />
      </div>
    </div>
  );
};

export default Sidebar;
