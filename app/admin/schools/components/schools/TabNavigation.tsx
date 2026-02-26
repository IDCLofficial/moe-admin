type Tab =
  | "notApplied"
  | "applied"
  | "approved"
  | "rejected"
  | "onboarded"
  | "completed"
  | "all";

interface TabNavigationProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabNavigation({ currentTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    // { 
    //   key: "all", 
    //   label: "All",
    //   description: "All applications regardless of status"
    // },

    { 
      key: "applied", 
      label: "Pending Review",
      description: "Applications pending review"
    },
    { 
      key: "approved", 
      label: "Approved",
      description: "Applications that have been approved"
    },
    { 
      key: "rejected", 
      label: "Rejected",
      description: "Applications that have been rejected"
    },
    // { 
    //   key: "onboarded", 
    //   label: "Onboarded",
    //   description: "Schools that have been onboarded"
    // },
    { 
      key: "completed", 
      label: "Completed",
      description: "Fully completed applications"
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key as Tab)}
          title={tab.description}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            currentTab === tab.key
              ? "bg-gray-600 text-white border-gray-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export type { Tab };
