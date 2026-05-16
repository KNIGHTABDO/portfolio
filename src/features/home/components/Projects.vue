<script setup lang="ts">
import { ref, onMounted } from "vue";
import NotchSection from "../../../components/NotchSection.vue";
import Banner from "../../../components/Banner.vue";
import { t } from "../../../i18n/utils/translate";

interface GithubRepo {
  name: string;
  html_url: string;
  description: string;
  homepage: string;
  topics: string[];
}

const loadedRepos = ref<GithubRepo[] | null>(null);
const loading = ref(true);

const emit = defineEmits<{
  (e: "loaded"): void;
}>();

const loadGithubProjects = async () => {
  try {
    const res = await fetch("https://api.github.com/users/knightabdo/repos?sort=updated&per_page=100");
    const data: GithubRepo[] = await res.json();
    
    // Sort logic to pin "serve" and "omni-mind" at the top
    const pinnedNames = ["serve", "omni-mind"];
    const pinnedRepos = data.filter(repo => pinnedNames.includes(repo.name));
    const otherRepos = data.filter(repo => !pinnedNames.includes(repo.name));
    
    loadedRepos.value = [...pinnedRepos, ...otherRepos].slice(0, 10); // Show top 10
  } catch (error) {
    console.error("Failed to load GitHub repos:", error);
  } finally {
    loading.value = false;
    emit("loaded");
  }
};

onMounted(loadGithubProjects);
</script>

<template>
  <div class="projects">
    <NotchSection class="projects-notch-start" />
    <NotchSection class="projects-notch-end" />
    <div class="grid">
      <div class="projects-title">
        <Banner class="projects-title-banner" :copy="t('selected')" size="sm" animated />
        <h2 class="projects-title-copy">{{ t("projects") }}</h2>
      </div>
    </div>
    <div class="grid">
      <div class="projects-cards">
        <div v-if="loading" class="loading">{{ t("loading") || 'Loading...' }}</div>
        
        <a 
          v-for="repo in loadedRepos" 
          :key="repo.name" 
          :href="repo.html_url" 
          target="_blank" 
          rel="noopener noreferrer"
          class="github-card"
        >
          <div class="github-card-content">
            <h3 class="repo-title">
              {{ repo.name }}
              <span v-if="['serve', 'omni-mind'].includes(repo.name)" class="pinned-badge">⭐</span>
            </h3>
            <p class="repo-desc">{{ repo.description || 'No description provided.' }}</p>
            <div class="repo-tags" v-if="repo.topics && repo.topics.length">
              <span class="tag" v-for="topic in repo.topics.slice(0, 3)" :key="topic">{{ topic }}</span>
            </div>
            <div class="repo-links">
              <span class="repo-link">View Repo ↗</span>
              <a 
                v-if="repo.homepage" 
                :href="repo.homepage" 
                target="_blank" 
                rel="noopener noreferrer"
                class="repo-link"
                @click.stop
              >Live Demo ↗</a>
            </div>
          </div>
        </a>
        
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.projects {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  gap: var(--space-xl);
  padding-left: var(--space-outer);
  padding-right: var(--space-outer);
  background-color: var(--color-beige-400);
  min-height: calc(var(--lvh) * 100 + var(--radius-xxl));
  padding-top: 96px;
  padding-bottom: 96px;

  @include mixins.mq("md") {
    padding-top: 144px;
    padding-bottom: 144px;
    gap: var(--space-xxl);
  }

  @include mixins.mq("lg") {
    gap: var(--space-xxxl);
  }

  &-title {
    position: relative;
    padding-top: var(--space-md);
    grid-column: 1 / 13;

    @include mixins.mq("md") {
      grid-column: 1 / 10;
    }

    @include mixins.mq("lg") {
      grid-column: 3 / 8;
    }

    &-copy {
      font-weight: 900;
      letter-spacing: 0.02em;
      font-size: var(--font-size-title-md);

      @include mixins.mq("sm") {
        font-size: var(--font-size-title-lg);
      }

      @include mixins.mq("xl") {
        font-size: var(--font-size-title-xl);
      }
    }

    &-banner {
      position: absolute;
      top: 0;
      left: -8px;
      transform: translate(0, -20%) rotate(-4deg);

      @include mixins.mq("lg") {
        left: -16px;
        transform: translate(0, -20%) rotate(-6deg);
      }
    }
  }

  &-notch {
    &-start {
      position: absolute;
      top: 0;
      left: 0;
      transform: translateY(-100%);
      color: var(--color-beige-400);
      --icon-color: var(--color-beige-400);
    }

    &-end {
      position: absolute;
      bottom: 0;
      left: 0;
      color: var(--color-beige-600);
      --icon-color: var(--color-beige-600);
    }
  }

  &-cards {
    max-width: 100%;
    flex: 1;
    grid-column: 1 / span 12;
    display: grid;
    gap: var(--space-lg);
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));

    @include mixins.mq("md") {
      grid-column: 1 / span 12;
    }

    @include mixins.mq("lg") {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      grid-column: 3 / span 8;
    }

    @include mixins.mq("xl") {
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    }
  }
}

.github-card {
  background: var(--color-gray-900);
  border: 1px solid var(--color-gray-700);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  text-decoration: none;
  color: var(--color-beige-100);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    border-color: var(--color-beige-400);
  }

  &-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.repo-title {
  font-size: var(--font-size-title-sm);
  font-weight: 700;
  margin-bottom: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.pinned-badge {
  font-size: 1.2rem;
}

.repo-desc {
  font-size: var(--font-size-body-sm);
  color: var(--color-gray-400);
  margin-bottom: var(--space-md);
  flex-grow: 1;
}

.repo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.tag {
  background: var(--color-gray-800);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-beige-400);
}

.repo-links {
  display: flex;
  gap: var(--space-md);
  margin-top: auto;
}

.repo-link {
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--color-beige-100);
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.2s ease;

  &:hover {
    text-decoration-color: var(--color-beige-100);
  }
}

.loading {
  color: var(--color-beige-100);
  font-size: var(--font-size-title-sm);
  text-align: center;
  grid-column: 1 / -1;
}
</style>
