"use client";

import { authClient, useSession } from "~/lib/auth-client";

const HomePage = () => {
  const { data } = useSession();
  const { data: activeMember } = authClient.useActiveMember();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const { data: listOrganizations } = authClient.useListOrganizations();

  return (
    <div>
      <div>HomePage</div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <pre>{JSON.stringify(activeMember, null, 2)}</pre>
      <pre>{JSON.stringify(activeOrganization, null, 2)}</pre>
      <pre>{JSON.stringify(listOrganizations, null, 2)}</pre>
    </div>
  );
};

export default HomePage;
