import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import { NIP19Page } from "./pages/NIP19Page";
import { PublishPage } from "./pages/publish/PublishPage";
import { PublishMagazinePage } from "./pages/publish/PublishMagazinePage";
import { PublishIssuePage } from "./pages/publish/PublishIssuePage";
import { PublishEbookPage } from "./pages/publish/PublishEbookPage";
import { PublishBlogPage } from "./pages/publish/PublishBlogPage";
import { EditMagazinePage } from "./pages/edit/EditMagazinePage";
import { EditIssuePage } from "./pages/edit/EditIssuePage";
import { EditEbookPage } from "./pages/edit/EditEbookPage";
import { EditBlogPage } from "./pages/edit/EditBlogPage";
import { ChangelogPage } from "./pages/ChangelogPage";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/publish" element={<PublishPage />} />
        <Route path="/publish/magazine" element={<PublishMagazinePage />} />
        <Route path="/publish/issue" element={<PublishIssuePage />} />
        <Route path="/publish/ebook" element={<PublishEbookPage />} />
        <Route path="/publish/blog" element={<PublishBlogPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/edit/magazine/:naddr" element={<EditMagazinePage />} />
        <Route path="/edit/issue/:naddr" element={<EditIssuePage />} />
        <Route path="/edit/ebook/:naddr" element={<EditEbookPage />} />
        <Route path="/edit/blog/:naddr" element={<EditBlogPage />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
