import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blog-data';

export const metadata: Metadata = {
  title: 'Blog — SmartRetail AI',
  description: 'Insights, guides, and product updates for modern retail operators.',
};

export default function BlogPage() {
  const featured = BLOG_POSTS.find((p) => p.featured);
  const rest = BLOG_POSTS.filter((p) => !p.featured);

  return (
    <div className="pt-20">

      {/* Hero */}
      <section className="py-14 text-center max-w-3xl mx-auto px-4 sm:px-6">
        <Badge variant="secondary" className="mb-4">Blog</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Insights for Modern Retailers
        </h1>
        <p className="text-muted-foreground text-lg">
          Practical guides, AI deep-dives, case studies, and product updates from the SmartRetail AI team.
        </p>
      </section>

      <section className="pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Featured post */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group block rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all mb-8"
          >
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-3 p-8 lg:p-10 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="default">Featured</Badge>
                  <Badge variant="secondary">{featured.category}</Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed flex-1">{featured.excerpt}</p>
                <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${featured.color}`}>
                      {featured.author.initials}
                    </div>
                    {featured.author.name}
                  </div>
                  <span>{featured.date}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {featured.readTime}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center p-8 min-h-[200px]">
                <div className="text-center">
                  <div className="text-5xl font-black text-primary/20">AI</div>
                  <div className="text-sm text-muted-foreground mt-2">Deep Dive</div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Post grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={`h-2 ${post.color.split(' ')[0]}`} />
              <div className="p-6 flex flex-col flex-1">
                <Badge variant="secondary" className="self-start mb-3 text-xs">
                  {post.category}
                </Badge>
                <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${post.color}`}>
                      {post.author.initials}
                    </div>
                    {post.author.name.split(' ')[0]}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </section>
    </div>
  );
}
