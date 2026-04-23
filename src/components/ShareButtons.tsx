import { Facebook, Twitter, Link } from 'lucide-react';

export function ShareButtons({ title, url }: { title: string, url: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`Check out the TrueWeb Rating for ${title} on YTDb!`);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const redditUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    alert('Link copied!');
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-xs uppercase tracking-widest text-gray-500 font-bold mr-2">Share:</span>
      <a href={twitterUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center hover:bg-[#333] transition-colors">
        <Twitter className="w-4 h-4 text-gray-300" />
      </a>
      <a href={facebookUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center hover:bg-[#333] transition-colors">
        <Facebook className="w-4 h-4 text-gray-300" />
      </a>
      <a href={redditUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center hover:bg-[#333] font-bold text-xs text-gray-300">
        R
      </a>
      <button onClick={copyLink} className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center hover:bg-[#333] transition-colors">
        <Link className="w-4 h-4 text-gray-300" />
      </button>
    </div>
  );
}
